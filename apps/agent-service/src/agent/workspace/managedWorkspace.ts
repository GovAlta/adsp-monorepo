import { dirname, extname, posix } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { TextDecoder } from 'node:util';
import { createGunzip } from 'node:zlib';
import { InvalidOperationError, InvalidValueError } from '@core-services/core-common';
import { Workspace } from '@mastra/core/workspace';
import * as tarStream from 'tar-stream';

export interface WorkspaceRevisionMetadata {
  revision: number;
  updatedAt: string;
}

export interface WorkspaceSnapshotFile {
  path: string;
  content: string;
}

export interface WorkspaceFileUpdate {
  path: string;
  content: string;
}

export interface WorkspaceUpdateRequest {
  writes?: WorkspaceFileUpdate[];
  deletes?: string[];
}

export interface WorkspaceUpdateResult {
  revision: WorkspaceRevisionMetadata;
  writeCount: number;
  deleteCount: number;
}

export interface WorkspaceReadResult {
  revision: WorkspaceRevisionMetadata;
  files: WorkspaceSnapshotFile[];
}

export interface WorkspaceFileDiff {
  path: string;
  content?: string;
}

export interface WorkspaceChangeEvent {
  toolName?: string;
  writes: WorkspaceFileDiff[];
  deletes: string[];
  writeCount: number;
  deleteCount: number;
}

type WorkspaceFilesystem = Workspace['filesystem'];

const WORKSPACE_METADATA_DIR = '.agent';
const WORKSPACE_REVISION_PATH = `${WORKSPACE_METADATA_DIR}/revision.json`;
const DEFAULT_WORKSPACE_REVISION = 0;
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

// File size limits for workspace initialization — configured via environment
import { environment } from '../../environments/environment';
const MAX_FILE_SIZE_BYTES = environment.AGENT_MAX_FILE_SIZE_BYTES;
const MAX_TARBALL_SIZE_BYTES = environment.AGENT_MAX_TARBALL_SIZE_BYTES;

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.ico',
  '.avif',
  '.svg',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.eot',
  '.pdf',
  '.zip',
  '.gz',
  '.tar',
  '.wasm',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
  '.ogg',
]);

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.txt',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.xml',
  '.yml',
  '.yaml',
  '.env',
  '.gitignore',
  '.gitattributes',
  '.npmrc',
  '.editorconfig',
  '.prettierrc',
  '.eslintrc',
  '.spec',
]);

function isNotFoundError(err: unknown): boolean {
  return err instanceof Error && /not found|enoent/i.test(err.message);
}

function getExtension(path?: string): string {
  if (!path) {
    return '';
  }

  const ext = extname(path).toLowerCase();
  if (ext) {
    return ext;
  }

  const basename = posix.basename(path).toLowerCase();
  if (basename.startsWith('.')) {
    return basename;
  }

  return '';
}

function isKnownBinaryPath(path?: string): boolean {
  const ext = getExtension(path);
  return !!ext && BINARY_EXTENSIONS.has(ext);
}

function isKnownTextPath(path?: string): boolean {
  const ext = getExtension(path);
  if (!ext) {
    return false;
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    return true;
  }

  return ext.startsWith('.config.');
}

function inferMimeType(path?: string): string {
  switch (getExtension(path)) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.bmp':
      return 'image/bmp';
    case '.ico':
      return 'image/x-icon';
    case '.avif':
      return 'image/avif';
    case '.svg':
      return 'image/svg+xml';
    case '.ttf':
      return 'font/ttf';
    case '.otf':
      return 'font/otf';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.eot':
      return 'application/vnd.ms-fontobject';
    case '.pdf':
      return 'application/pdf';
    case '.wasm':
      return 'application/wasm';
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    default:
      return 'application/octet-stream';
  }
}

function isLikelyTextBuffer(buffer: Buffer, path?: string): boolean {
  if (isKnownBinaryPath(path)) {
    // A binary-extension file that was previously stored as a data URL (e.g. written
    // back from a tar that contained the data URL text) should be returned as-is text
    // rather than re-encoded. Detect by checking for the data: prefix bytes.
    if (buffer.length >= 5 && buffer.slice(0, 5).toString('ascii') === 'data:') {
      return true;
    }
    return false;
  }

  if (isKnownTextPath(path)) {
    return true;
  }

  if (buffer.includes(0)) {
    return false;
  }

  let decoded = '';
  try {
    decoded = UTF8_DECODER.decode(buffer);
  } catch {
    return false;
  }

  // Count non-printable control characters (excluding tab \x09, LF \x0A, CR \x0D)
  // eslint-disable-next-line no-control-regex
  const control = decoded.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g)?.length || 0;
  return control / Math.max(decoded.length, 1) < 0.2;
}

function parseBase64DataUrl(value: string): { mimeType: string; base64: string } | undefined {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value.trim());
  if (!match) {
    return undefined;
  }

  return {
    mimeType: match[1].toLowerCase(),
    base64: match[2].replace(/\s+/g, ''),
  };
}

function decodeUpdateContent(path: string, content: string): string | Buffer {
  const parsed = parseBase64DataUrl(content);
  if (!parsed) {
    return content;
  }

  const shouldDecode =
    isKnownBinaryPath(path) ||
    (!parsed.mimeType.startsWith('text/') &&
      parsed.mimeType !== 'application/json' &&
      parsed.mimeType !== 'application/xml');

  if (!shouldDecode) {
    return content;
  }

  try {
    return Buffer.from(parsed.base64, 'base64');
  } catch {
    return content;
  }
}

function decodeWorkspaceContent(content: unknown, path?: string): string {
  if (typeof content === 'string') {
    return content;
  }

  let buffer: Buffer;
  if (content instanceof Uint8Array) {
    buffer = Buffer.from(content);
  } else if (Buffer.isBuffer(content)) {
    buffer = content;
  } else {
    throw new InvalidOperationError('Workspace file content could not be decoded as UTF-8 text.');
  }

  if (isLikelyTextBuffer(buffer, path)) {
    return buffer.toString('utf-8');
  }

  return `data:${inferMimeType(path)};base64,${buffer.toString('base64')}`;
}

function validateWorkspacePath(path: string): string {
  if (typeof path !== 'string' || !path.trim()) {
    throw new InvalidValueError('path', 'path must be a non-empty relative file path.');
  }

  if (posix.isAbsolute(path)) {
    throw new InvalidOperationError('Workspace paths must be relative.');
  }

  const normalized = posix.normalize(path).replace(/^\.\//, '');

  if (!normalized || normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new InvalidOperationError('Workspace paths must stay within the workspace root.');
  }

  if (normalized === WORKSPACE_METADATA_DIR || normalized.startsWith(`${WORKSPACE_METADATA_DIR}/`)) {
    throw new InvalidOperationError('Reserved workspace metadata paths cannot be modified.');
  }

  return normalized;
}

function decodeTarball(data: Uint8Array | Buffer | Readable, compressed?: boolean): Readable {
  // For stream input, compression cannot be safely inferred without consuming bytes.
  // Use explicit metadata-derived compression flag from the caller.
  if (data instanceof Readable) {
    if (!compressed) {
      return data;
    }

    return data.pipe(createGunzip());
  }

  // Handle buffer input (original behavior)
  const buffer = Buffer.from(data);
  const isGzip = compressed ?? (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b);

  const readable = Readable.from(buffer);
  if (!isGzip) {
    return readable;
  }

  return readable.pipe(createGunzip());
}

function resolveTarEntryPath(path: string): string | undefined {
  const normalized = posix.normalize(path);
  const relative = normalized.replace(/^\.\//, '');

  // Many tar tools include a root directory marker entry (e.g. "./").
  // It is safe to ignore because it does not map to a workspace file.
  if (!relative || relative === '.' || relative === './') {
    return undefined;
  }

  const segments = relative.split('/').filter(Boolean);
  const basename = segments[segments.length - 1];

  // Ignore macOS metadata emitted by Finder/BSD tar when archiving folders.
  if (segments[0] === '__MACOSX' || basename === '.DS_Store' || basename.startsWith('._')) {
    return undefined;
  }

  return validateWorkspacePath(relative);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Mastra workspace tool IDs that mutate files (write or delete)
const MASTRA_WRITE_TOOLS = new Set(['mastra_workspace_write_file', 'mastra_workspace_edit_file']);
const MASTRA_DELETE_TOOLS = new Set(['mastra_workspace_delete']);

interface PendingCall {
  toolName: string;
  args: Record<string, unknown>;
}

/**
 * Stateful projector scoped to a single agent message stream.
 * Pairs tool-call (input) with tool-result (confirmation) to synthesise
 * WorkspaceChangeEvent instances for mutating Mastra workspace tool calls.
 *
 * Obtain via ManagedWorkspace.createProjector() so that edit_file results are
 * backfilled with the post-edit file content from the workspace, producing a
 * consistent event shape for every mutating tool.
 */
export class WorkspaceChangeProjector {
  private pendingCalls = new Map<string, PendingCall>();

  constructor(private readonly workspace?: ManagedWorkspace) {}

  onToolCall(payload: unknown): void {
    if (!isRecord(payload)) return;
    const toolCallId = typeof payload.toolCallId === 'string' ? payload.toolCallId : undefined;
    const toolName = typeof payload.toolName === 'string' ? payload.toolName : undefined;
    const args = isRecord(payload.args) ? payload.args : undefined;

    if (!toolCallId || !toolName || !args) return;
    if (!MASTRA_WRITE_TOOLS.has(toolName) && !MASTRA_DELETE_TOOLS.has(toolName)) return;

    this.pendingCalls.set(toolCallId, { toolName, args });
  }

  onToolError(payload: unknown): void {
    if (!isRecord(payload)) return;

    const toolCallId = typeof payload.toolCallId === 'string' ? payload.toolCallId : undefined;
    if (!toolCallId) return;

    this.pendingCalls.delete(toolCallId);
  }

  async onToolResult(payload: unknown): Promise<WorkspaceChangeEvent | undefined> {
    if (!isRecord(payload)) return undefined;

    const toolCallId = typeof payload.toolCallId === 'string' ? payload.toolCallId : undefined;
    const toolName = typeof payload.toolName === 'string' ? payload.toolName : undefined;

    if (!toolCallId || !toolName) return undefined;

    const pending = this.pendingCalls.get(toolCallId);
    if (!pending) return undefined;

    this.pendingCalls.delete(toolCallId);

    const path = typeof pending.args.path === 'string' ? pending.args.path : undefined;
    if (!path) return undefined;

    let normalizedPath: string;
    try {
      normalizedPath = validateWorkspacePath(path);
    } catch {
      return undefined;
    }

    if (MASTRA_WRITE_TOOLS.has(toolName)) {
      // write_file provides full content in args.
      // edit_file only has old/new patch strings — read the post-edit file from the workspace.
      let content = typeof pending.args.content === 'string' ? pending.args.content : undefined;

      if (content === undefined && this.workspace) {
        try {
          const file = await this.workspace.readFile(normalizedPath);
          content = file.content;
        } catch {
          // If the read fails, emit the event without content. The client can
          // reconcile via workspace-read on stream completion.
        }
      }

      const write: WorkspaceFileDiff =
        content !== undefined ? { path: normalizedPath, content } : { path: normalizedPath };

      return { toolName, writes: [write], deletes: [], writeCount: 1, deleteCount: 0 };
    }

    if (MASTRA_DELETE_TOOLS.has(toolName)) {
      return { toolName, writes: [], deletes: [normalizedPath], writeCount: 0, deleteCount: 1 };
    }

    return undefined;
  }
}

export class ManagedWorkspace {
  constructor(private readonly filesystem: WorkspaceFilesystem) {}

  public static from(workspace: Pick<Workspace, 'filesystem'>): ManagedWorkspace {
    if (!workspace?.filesystem) {
      throw new InvalidOperationError('Workspace is not enabled for this agent.');
    }

    return new ManagedWorkspace(workspace.filesystem);
  }

  public static validatePath(path: string): string {
    return validateWorkspacePath(path);
  }

  public async clear(): Promise<void> {
    const existing = await this.filesystem.readdir('.');
    for (const entry of existing) {
      if (entry.type === 'directory') {
        await this.filesystem.rmdir(entry.name, { recursive: true, force: true });
      } else {
        await this.filesystem.deleteFile(entry.name, { recursive: true, force: true });
      }
    }
  }

  public async getRevision(): Promise<WorkspaceRevisionMetadata> {
    try {
      const content = await this.filesystem.readFile(WORKSPACE_REVISION_PATH);
      const parsed = JSON.parse(
        decodeWorkspaceContent(content, WORKSPACE_REVISION_PATH),
      ) as Partial<WorkspaceRevisionMetadata>;
      const revision = Number(parsed.revision);

      return {
        revision: Number.isInteger(revision) && revision >= 0 ? revision : DEFAULT_WORKSPACE_REVISION,
        updatedAt:
          typeof parsed.updatedAt === 'string' && parsed.updatedAt.trim()
            ? parsed.updatedAt
            : new Date(0).toISOString(),
      };
    } catch (err) {
      if (isNotFoundError(err)) {
        return {
          revision: DEFAULT_WORKSPACE_REVISION,
          updatedAt: new Date(0).toISOString(),
        };
      }

      throw err;
    }
  }

  public async setRevision(revision: number): Promise<WorkspaceRevisionMetadata> {
    if (!Number.isInteger(revision) || revision < 0) {
      throw new InvalidValueError('revision', 'revision must be a non-negative integer.');
    }

    const metadata: WorkspaceRevisionMetadata = {
      revision,
      updatedAt: new Date().toISOString(),
    };

    await this.filesystem.mkdir(dirname(WORKSPACE_REVISION_PATH), { recursive: true });
    await this.filesystem.writeFile(WORKSPACE_REVISION_PATH, JSON.stringify(metadata), { recursive: true });

    return metadata;
  }

  public async incrementRevision(): Promise<WorkspaceRevisionMetadata> {
    const current = await this.getRevision();
    return this.setRevision(current.revision + 1);
  }

  public async initializeFromTarball(
    data: Uint8Array | Buffer | Readable,
    compressed?: boolean,
  ): Promise<WorkspaceRevisionMetadata> {
    await this.clear();
    const extract = tarStream.extract();
    let totalSize = 0;

    extract.on(
      'entry',
      async (
        header: { name: string; type: string; size?: number },
        stream: NodeJS.ReadableStream,
        next: (err?: Error) => void,
      ) => {
        try {
          const entryPath = resolveTarEntryPath(header.name);
          const chunks: Buffer[] = [];
          for await (const chunk of stream as AsyncIterable<Buffer>) {
            chunks.push(chunk);
          }

          if (!entryPath) {
            next();
            return;
          }

          if (header.type === 'directory') {
            await this.filesystem.mkdir(entryPath, { recursive: true });
          } else if (header.type === 'file') {
            const fileContent = Buffer.concat(chunks);
            const fileSize = fileContent.length;

            // Validate individual file size
            if (fileSize > MAX_FILE_SIZE_BYTES) {
              throw new InvalidOperationError(
                `File "${entryPath}" exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB (` +
                  `actual: ${fileSize / (1024 * 1024)}MB).`,
              );
            }

            // Validate cumulative tarball size
            totalSize += fileSize;
            if (totalSize > MAX_TARBALL_SIZE_BYTES) {
              throw new InvalidOperationError(
                `Workspace tarball exceeds maximum size of ${MAX_TARBALL_SIZE_BYTES / (1024 * 1024)}MB.`,
              );
            }

            await this.filesystem.writeFile(entryPath, fileContent, { recursive: true });
          }

          next();
        } catch (err) {
          next(err instanceof Error ? err : new Error(String(err)));
        }
      },
    );

    try {
      await pipeline(decodeTarball(data, compressed), extract);
    } catch {
      throw new InvalidOperationError('Workspace tarball could not be decompressed as gzip data.');
    }

    return this.setRevision(1);
  }

  public async applyUpdate(update: WorkspaceUpdateRequest): Promise<WorkspaceUpdateResult> {
    const writes = update.writes || [];
    const deletes = update.deletes || [];

    for (const { path, content } of writes) {
      const normalizedPath = validateWorkspacePath(path);
      await this.filesystem.writeFile(normalizedPath, decodeUpdateContent(normalizedPath, content), {
        recursive: true,
      });
    }

    for (const path of deletes) {
      await this.filesystem.deleteFile(validateWorkspacePath(path), { recursive: true, force: true });
    }

    const revision =
      writes.length > 0 || deletes.length > 0 ? await this.incrementRevision() : await this.getRevision();

    return {
      revision,
      writeCount: writes.length,
      deleteCount: deletes.length,
    };
  }

  public readFile(path: string): Promise<WorkspaceSnapshotFile> {
    const normalizedPath = validateWorkspacePath(path);
    return this.filesystem
      .readFile(normalizedPath)
      .then((content) => ({ path: normalizedPath, content: decodeWorkspaceContent(content, normalizedPath) }));
  }

  public createProjector(): WorkspaceChangeProjector {
    return new WorkspaceChangeProjector(this);
  }

  public async readSnapshot(): Promise<WorkspaceReadResult> {
    const [revision, files] = await Promise.all([this.getRevision(), this.listFiles('.')]);

    return { revision, files };
  }

  private async listFiles(directory: string): Promise<WorkspaceSnapshotFile[]> {
    const entries = await this.filesystem.readdir(directory);
    const files: WorkspaceSnapshotFile[] = [];

    for (const entry of entries) {
      if (directory === '.' && entry.name === WORKSPACE_METADATA_DIR) {
        continue;
      }

      const entryPath = directory === '.' ? entry.name : posix.join(directory, entry.name);
      if (entry.type === 'directory') {
        files.push(...(await this.listFiles(entryPath)));
      } else {
        const content = await this.filesystem.readFile(entryPath);
        files.push({
          path: entryPath,
          content: decodeWorkspaceContent(content, entryPath),
        });
      }
    }

    return files.sort((left, right) => left.path.localeCompare(right.path));
  }
}
