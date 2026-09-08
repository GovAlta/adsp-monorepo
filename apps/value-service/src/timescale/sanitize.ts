// PostgreSQL text -- and therefore jsonb, which stores text -- cannot represent U+0000. An insert
// carrying one fails with "unsupported Unicode escape sequence", and for the event log that means the
// entry is retried once and then dead-lettered rather than recorded.
//
// Publishers cannot be relied on to exclude it. Observed in adsp-dev: stored PDF and email templates
// contained six-hex-digit escapes -- `\u0000b7` where `\u00b7` (a middle dot) was meant, likewise
// `\u000026`, `\u000027` and `\u00002d`. JSON reads exactly four hex digits after `\u`, so each of those
// decodes to U+0000 followed by the leftover digits as literal text. Stripping at the storage
// boundary is the only place that covers every publisher.
const NUL = '\u0000';

function stripFromString(value: string): string {
  return value.includes(NUL) ? value.split(NUL).join('') : value;
}

/**
 * Remove U+0000 from every string in a value, including object keys.
 *
 * Returns the **same reference** when nothing needed removing, so a caller can detect whether
 * anything was altered with `result !== input` -- avoiding both a second traversal and a needless
 * copy on the common path.
 */
export function stripNul<T>(value: T): T {
  if (typeof value === 'string') {
    return stripFromString(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const cleaned = stripNul(item);
      changed = changed || cleaned !== item;
      return cleaned;
    });

    return (changed ? next : value) as unknown as T;
  }

  // Dates and other non-plain objects would be flattened by Object.entries, so leave them alone.
  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const cleanedKey = stripFromString(key);
    const cleaned = stripNul(item);
    changed = changed || cleanedKey !== key || cleaned !== item;
    next[cleanedKey] = cleaned;
  }

  return (changed ? next : value) as unknown as T;
}
