export type ChangeKind = 'added' | 'removed' | 'changed' | 'unchanged';

export interface ChangeEntry {
  path: string;
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
}

const isContainer = (value: unknown): value is Record<string, unknown> | unknown[] =>
  typeof value === 'object' && value !== null;

// Flattens nested objects and arrays to dotted paths; empty containers are kept as leaves.
const flatten = (value: unknown, prefix = '', result: Map<string, unknown> = new Map()) => {
  if (isContainer(value) && Object.keys(value).length > 0) {
    Object.entries(value).forEach(([key, child]) =>
      flatten(child, Array.isArray(value) ? `${prefix}[${key}]` : prefix ? `${prefix}.${key}` : key, result),
    );
  } else if (prefix) {
    result.set(prefix, value);
  }
  return result;
};

export const diffChangeSet = (before: unknown, after: unknown): ChangeEntry[] => {
  const left = flatten(before);
  const right = flatten(after);
  const paths = Array.from(new Set([...left.keys(), ...right.keys()])).sort((a, b) => a.localeCompare(b));

  return paths.map((path) => {
    const inBefore = left.has(path);
    const inAfter = right.has(path);
    if (inBefore && !inAfter) {
      return { path, kind: 'removed', before: left.get(path) };
    }
    if (!inBefore && inAfter) {
      return { path, kind: 'added', after: right.get(path) };
    }
    const unchanged = JSON.stringify(left.get(path)) === JSON.stringify(right.get(path));
    return { path, kind: unchanged ? 'unchanged' : 'changed', before: left.get(path), after: right.get(path) };
  });
};
