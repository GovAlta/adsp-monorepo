type WorkspaceFileTree = Record<string, { directory: WorkspaceFileTree } | { file: { contents: string } }>;

export interface WorkspaceSnapshotFile {
  path: string;
  content: string;
}

export interface WorkspaceFileDiff {
  path: string;
  content?: string;
}

export interface WorkspaceChangeEvent {
  writes: WorkspaceFileDiff[];
  deletes: string[];
  revision?: number;
  updatedAt?: string;
  toolName?: string;
}

export type WorkspaceFileMap = Record<string, string>;

export const BUILDER_AGENT_ID = 'builderAgent';
export const DEFAULT_SELECTED_FILE = 'src/App.tsx';

const THREAD_KEY_PREFIX = 'builder-app:thread:';

function normalizePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}

export function applyWorkspaceSnapshot(files: WorkspaceSnapshotFile[]): WorkspaceFileMap {
  return files.reduce<WorkspaceFileMap>((result, file) => {
    result[normalizePath(file.path)] = file.content;
    return result;
  }, {});
}

export function applyWorkspaceChange(current: WorkspaceFileMap, change: WorkspaceChangeEvent): WorkspaceFileMap {
  const next = { ...current };

  for (const file of change.writes) {
    if (typeof file.content === 'string') {
      next[normalizePath(file.path)] = file.content;
    }
  }

  for (const path of change.deletes) {
    delete next[normalizePath(path)];
  }

  return next;
}

export function diffWorkspaceFiles(previous: WorkspaceFileMap, next: WorkspaceFileMap): WorkspaceChangeEvent {
  const writes = Object.entries(next)
    .filter(([path, content]) => previous[path] !== content)
    .map(([path, content]) => ({ path, content }));
  const deletes = Object.keys(previous).filter((path) => !(path in next));

  return { writes, deletes };
}

export function sortWorkspaceFiles(files: WorkspaceFileMap): WorkspaceSnapshotFile[] {
  return Object.entries(files)
    .map(([path, content]) => ({ path, content }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function getDefaultSelectedPath(files: WorkspaceFileMap, preferred = DEFAULT_SELECTED_FILE): string {
  if (files[preferred]) {
    return preferred;
  }

  return Object.keys(files).sort((left, right) => left.localeCompare(right))[0] ?? preferred;
}

export function getOrCreateThreadId(tenantName: string): string {
  const storageKey = `${THREAD_KEY_PREFIX}${tenantName}`;
  const current = window.localStorage.getItem(storageKey);

  if (current) {
    return current;
  }

  const created =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(storageKey, created);
  return created;
}

export function toFileTree(files: WorkspaceFileMap): WorkspaceFileTree {
  const root: Record<string, { directory: Record<string, unknown> } | { file: { contents: string } }> = {};

  for (const [path, content] of Object.entries(files)) {
    const segments = normalizePath(path).split('/').filter(Boolean);
    let current: Record<string, unknown> = root;

    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1;
      if (isLeaf) {
        current[segment] = { file: { contents: content } };
        return;
      }

      if (!(segment in current)) {
        current[segment] = { directory: {} };
      }

      current = (current[segment] as { directory: Record<string, unknown> }).directory;
    });
  }

  return root as WorkspaceFileTree;
}

// --- Tar archive helpers ---

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
  '.wasm',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
  '.ogg',
]);

export function isBinaryPath(path: string): boolean {
  const lower = path.toLowerCase();
  const dot = lower.lastIndexOf('.');
  return dot !== -1 && BINARY_EXTENSIONS.has(lower.slice(dot));
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.avif', '.svg']);

export function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  const dot = lower.lastIndexOf('.');
  return dot !== -1 && IMAGE_EXTENSIONS.has(lower.slice(dot));
}

function decodeFileContent(path: string, content: string): Uint8Array {
  const encoder = new TextEncoder();
  if (isBinaryPath(path)) {
    const match = /^data:[^;,]+;base64,([A-Za-z0-9+/=\s]+)$/.exec(content.trim());
    if (match) {
      const b64 = match[1].replace(/\s+/g, '');
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
  }
  return encoder.encode(content);
}

function writeTarString(target: Uint8Array, offset: number, size: number, value: string): void {
  const bytes = new TextEncoder().encode(value);
  const length = Math.min(bytes.length, size);
  target.set(bytes.slice(0, length), offset);
}

function writeTarOctal(target: Uint8Array, offset: number, size: number, value: number): void {
  const octal = Math.max(0, Math.floor(value)).toString(8);
  const bodyLength = Math.max(0, size - 1);
  const body = octal.padStart(bodyLength, '0').slice(-bodyLength);
  writeTarString(target, offset, bodyLength, body);
  target[offset + size - 1] = 0;
}

function normalizeTarPath(path: string): { name: string; prefix: string } {
  const normalized = path.replace(/^\/+/, '').replace(/\\/g, '/');

  if (normalized.length <= 100) {
    return { name: normalized, prefix: '' };
  }

  const splitIndex = normalized.lastIndexOf('/');
  if (splitIndex > 0) {
    const prefix = normalized.slice(0, splitIndex);
    const name = normalized.slice(splitIndex + 1);
    if (name.length <= 100 && prefix.length <= 155) {
      return { name, prefix };
    }
  }

  return { name: normalized.slice(-100), prefix: '' };
}

export function createTarArchive(files: WorkspaceSnapshotFile[]): Blob {
  const now = Math.floor(Date.now() / 1000);
  const chunks: Uint8Array[] = [];

  for (const file of files) {
    const { name, prefix } = normalizeTarPath(file.path);
    const content = decodeFileContent(file.path, file.content ?? '');
    const header = new Uint8Array(512);

    writeTarString(header, 0, 100, name);
    writeTarOctal(header, 100, 8, 0o644);
    writeTarOctal(header, 108, 8, 0);
    writeTarOctal(header, 116, 8, 0);
    writeTarOctal(header, 124, 12, content.length);
    writeTarOctal(header, 136, 12, now);

    for (let index = 148; index < 156; index++) {
      header[index] = 0x20;
    }

    header[156] = '0'.charCodeAt(0);
    writeTarString(header, 257, 6, 'ustar');
    writeTarString(header, 263, 2, '00');
    writeTarString(header, 345, 155, prefix);

    const checksum = header.reduce((sum, value) => sum + value, 0);
    const checksumOctal = checksum.toString(8).padStart(6, '0').slice(-6);
    writeTarString(header, 148, 6, checksumOctal);
    header[154] = 0;
    header[155] = 0x20;

    chunks.push(header);
    chunks.push(content);

    const remainder = content.length % 512;
    if (remainder !== 0) {
      chunks.push(new Uint8Array(512 - remainder));
    }
  }

  chunks.push(new Uint8Array(1024));
  return new Blob(chunks as unknown as BlobPart[], { type: 'application/x-tar' });
}

export async function gzipBlob(blob: Blob): Promise<Blob> {
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = await new Response(stream).arrayBuffer();
  return new Blob([compressed], { type: 'application/gzip' });
}
