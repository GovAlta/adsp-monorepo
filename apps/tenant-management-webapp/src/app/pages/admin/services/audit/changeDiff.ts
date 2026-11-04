export type ChangeKind = 'added' | 'removed' | 'changed' | 'unchanged';

export interface ChangeEntry {
  path: string;
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
}

type Segment = string | number;

interface Leaf {
  segments: Segment[];
  value: unknown;
}

const isContainer = (value: unknown): value is Record<string, unknown> | unknown[] =>
  typeof value === 'object' && value !== null;

const isEmptyLeaf = (value: unknown) => value === null || (isContainer(value) && Object.keys(value).length === 0);

// Keys containing "." or brackets are quoted, e.g. ["a.b"], so they read differently from a nested a -> b.
const formatPath = (segments: Segment[]) =>
  segments.reduce<string>((path, segment) => {
    if (typeof segment === 'number') {
      return `${path}[${segment}]`;
    }
    return /[.[\]]/.test(segment) ? `${path}[${JSON.stringify(segment)}]` : path ? `${path}.${segment}` : segment;
  }, '');

// Flattens nested objects and arrays to leaves keyed by their path segments, so that a literal key
// such as "a.b" cannot collide with a nested a -> b. Empty containers and null are kept as leaves.
const flatten = (value: unknown, segments: Segment[] = [], result: Map<string, Leaf> = new Map()) => {
  if (isContainer(value) && Object.keys(value).length > 0) {
    Object.entries(value).forEach(([key, child]) =>
      flatten(child, [...segments, Array.isArray(value) ? Number(key) : key], result),
    );
  } else if (segments.length > 0) {
    result.set(JSON.stringify(segments), { segments, value });
  }
  return result;
};

// An empty/null leaf that the other side populates with children is not a removal; the children carry the change.
const dropReplacedLeaves = (leaves: Map<string, Leaf>, other: Map<string, Leaf>) => {
  leaves.forEach((leaf, key) => {
    if (!isEmptyLeaf(leaf.value)) {
      return;
    }
    const prefix = key.slice(0, -1);
    if (Array.from(other.keys()).some((otherKey) => otherKey.startsWith(`${prefix},`))) {
      leaves.delete(key);
    }
  });
};

export const diffChangeSet = (before: unknown, after: unknown): ChangeEntry[] => {
  const left = flatten(before);
  const right = flatten(after);
  dropReplacedLeaves(left, right);
  dropReplacedLeaves(right, left);

  const entries = new Map<string, string>();
  [...left.values(), ...right.values()].forEach(({ segments }) =>
    entries.set(JSON.stringify(segments), formatPath(segments)),
  );
  const keys = Array.from(entries.keys()).sort(
    (a, b) => entries.get(a).localeCompare(entries.get(b)) || a.localeCompare(b),
  );

  return keys.map((key) => {
    const path = entries.get(key);
    const l = left.get(key);
    const r = right.get(key);
    if (l && !r) {
      return { path, kind: 'removed', before: l.value };
    }
    if (!l && r) {
      return { path, kind: 'added', after: r.value };
    }
    const unchanged = JSON.stringify(l.value) === JSON.stringify(r.value);
    return { path, kind: unchanged ? 'unchanged' : 'changed', before: l.value, after: r.value };
  });
};
