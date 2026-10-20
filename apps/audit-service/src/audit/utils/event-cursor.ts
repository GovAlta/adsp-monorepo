import { EventCursor, StoredEvent } from '../types';
import { decodeKeysetCursor, encodeKeysetCursor } from './keyset-cursor';

// Keyset cursor over the (occurred_at, id) ordering, stable against the audit events recorded by reads themselves.
export function encodeEventCursor(event: Pick<StoredEvent, 'occurred_at' | 'id'>): string {
  return encodeKeysetCursor(event.occurred_at, event.id);
}

export function decodeEventCursor(value: string): EventCursor | null {
  const cursor = decodeKeysetCursor(value);
  return cursor ? { occurredAt: cursor.timestamp, id: cursor.id } : null;
}
