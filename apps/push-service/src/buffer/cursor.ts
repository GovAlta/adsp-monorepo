/**
 * Cursor sent to clients as the SSE `id`: `{epoch}.{entryId}`.
 *
 * The entry id is the Redis stream entry id (`{ms}-{seq}`), which is monotonic per tenant stream. The epoch is a
 * random value created with the tenant stream; if Redis loses data the epoch changes, so a client holding an old cursor
 * is told to resync rather than silently skipping events.
 */
export interface Cursor {
  epoch: string;
  entryId: string;
}

const ENTRY_ID = /^\d+-\d+$/;

export function formatCursor(epoch: string, entryId: string): string {
  return `${epoch}.${entryId}`;
}

export function parseCursor(value: unknown): Cursor | null {
  if (typeof value !== 'string') {
    return null;
  }

  const separator = value.lastIndexOf('.');
  const epoch = value.substring(0, separator);
  const entryId = value.substring(separator + 1);
  return separator > 0 && ENTRY_ID.test(entryId) ? { epoch, entryId } : null;
}

/**
 * Compares two Redis stream entry ids.
 * @returns negative if a is before b, 0 if equal, positive if a is after b.
 */
export function compareEntryIds(a: string, b: string): number {
  const [aMs, aSeq] = a.split('-').map(Number);
  const [bMs, bSeq] = b.split('-').map(Number);
  return aMs - bMs || aSeq - bSeq;
}
