import { InvalidOperationError } from '@core-services/core-common';

const UNSAFE_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export function assertDataPath(path: string): string[] {
  const segments = path.split('.');
  if (segments.some((segment) => !segment || UNSAFE_SEGMENTS.has(segment))) {
    throw new InvalidOperationError(`Invalid data path '${path}'.`);
  }
  return segments;
}

export function setValueAtPath(data: Record<string, unknown>, path: string, value: unknown): void {
  const segments = assertDataPath(path);
  let current = data;
  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (next === undefined || next === null) {
      current[segment] = {};
    } else if (typeof next !== 'object') {
      throw new InvalidOperationError(`Cannot set a value at data path '${path}'.`);
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
}
