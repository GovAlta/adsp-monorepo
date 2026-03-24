import { dirname, posix } from 'node:path';
import { Readable } from 'node:stream';
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

function isNotFoundError(err: unknown): boolean {
  return err instanceof Error && /not found|enoent/i.test(err.message);
}

function decodeWorkspaceContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (content instanceof Uint8Array) {
    return Buffer.from(content).toString('utf-8');
  }

  if (Buffer.isBuffer(content)) {
    return content.toString('utf-8');
  }

  throw new InvalidOperationError('Workspace file content could not be decoded as UTF-8 text.');
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
      const parsed = JSON.parse(decodeWorkspaceContent(content)) as Partial<WorkspaceRevisionMetadata>;
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

  public async initializeFromTarball(data: Uint8Array | Buffer): Promise<WorkspaceRevisionMetadata> {
    await this.clear();

    await new Promise<void>((resolve, reject) => {
      const extract = tarStream.extract();

      extract.on(
        'entry',
        async (header: { name: string; type: string }, stream: NodeJS.ReadableStream, next: (err?: Error) => void) => {
          try {
            const entryPath = validateWorkspacePath(header.name);
            const chunks: Buffer[] = [];
            for await (const chunk of stream as AsyncIterable<Buffer>) {
              chunks.push(chunk);
            }

            if (header.type === 'directory') {
              await this.filesystem.mkdir(entryPath, { recursive: true });
            } else if (header.type === 'file') {
              await this.filesystem.writeFile(entryPath, Buffer.concat(chunks), { recursive: true });
            }

            next();
          } catch (err) {
            next(err instanceof Error ? err : new Error(String(err)));
          }
        },
      );

      extract.on('finish', resolve);
      extract.on('error', reject);

      Readable.from(Buffer.from(data)).pipe(extract);
    });

    return this.setRevision(1);
  }

  public async applyUpdate(update: WorkspaceUpdateRequest): Promise<WorkspaceUpdateResult> {
    const writes = update.writes || [];
    const deletes = update.deletes || [];

    for (const { path, content } of writes) {
      await this.filesystem.writeFile(validateWorkspacePath(path), content, { recursive: true });
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
      .then((content) => ({ path: normalizedPath, content: decodeWorkspaceContent(content) }));
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
          content: decodeWorkspaceContent(content),
        });
      }
    }

    return files.sort((left, right) => left.path.localeCompare(right.path));
  }
}
