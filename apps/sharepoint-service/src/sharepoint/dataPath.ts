import { InvalidOperationError } from '@core-services/core-common';

export type PathSegment = string | number;

const UNSAFE_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
const PART_PATTERN = /^([^.[\]]+)((?:\[\d+\])*)$/;
const INDEX_PATTERN = /\[(\d+)\]/g;
// The forms app writes array indexes as dot segments, for example dependents.0.birthCertificate.
const DOT_INDEX_PATTERN = /^\d+$/;

export function assertDataPath(path: string): PathSegment[] {
  const segments: PathSegment[] = [];
  for (const part of path.split('.')) {
    const match = PART_PATTERN.exec(part);
    if (!match || UNSAFE_SEGMENTS.has(match[1])) {
      throw new InvalidOperationError(`Invalid data path '${path}'.`);
    }
    const name = DOT_INDEX_PATTERN.test(match[1]) ? Number(match[1]) : match[1];
    segments.push(name, ...Array.from(match[2].matchAll(INDEX_PATTERN), ([, index]) => Number(index)));
  }
  return segments;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// Keeps a stray large index from building a huge sparse array.
const MAX_ARRAY_INDEX = 1000;

// A number indexes an array and is a key on an object; anything else can't be followed.
function keyIn(container: unknown, segment: PathSegment): PathSegment | null {
  if (Array.isArray(container)) {
    return typeof segment === 'number' && segment <= MAX_ARRAY_INDEX ? segment : null;
  }
  return isRecord(container) ? String(segment) : null;
}

export function valueAtPath(data: unknown, path: string): unknown {
  let segments: PathSegment[];
  try {
    segments = assertDataPath(path);
  } catch {
    return undefined;
  }
  return segments.reduce<unknown>((current, segment) => {
    const key = keyIn(current, segment);
    return key !== null && Object.prototype.hasOwnProperty.call(current, key)
      ? (current as Record<PathSegment, unknown>)[key]
      : undefined;
  }, data);
}

export function setValueAtPath(data: Record<string, unknown>, path: string, value: unknown): void {
  const segments = assertDataPath(path);

  let current: unknown = data;
  segments.forEach((segment, index) => {
    const key = keyIn(current, segment);
    // assertDataPath already rejects these; checked again beside the assignments so the guard stays with them.
    if (key === null || key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new InvalidOperationError(`Cannot set a value at data path '${path}'.`);
    }
    const container = current as Record<PathSegment, unknown>;
    if (index === segments.length - 1) {
      container[key] = value;
      return;
    }
    if (container[key] === undefined || container[key] === null) {
      container[key] = typeof segments[index + 1] === 'number' ? [] : {};
    }
    current = container[key];
  });
}
