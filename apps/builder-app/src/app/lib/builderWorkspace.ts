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
