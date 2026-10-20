import isUUID from 'validator/lib/isUUID';
import { EventCursor, StoredEvent } from '../types';

// Keyset cursor over the (occurred_at, id) ordering. Unlike an offset it is unaffected by events
// inserted while a caller is paging, including the audit events recorded by the reads themselves.
export function encodeEventCursor(event: Pick<StoredEvent, 'occurred_at' | 'id'>): string {
  const occurredAt = new Date(event.occurred_at).toISOString();
  return Buffer.from(JSON.stringify({ t: occurredAt, i: event.id })).toString('base64url');
}

export function decodeEventCursor(value: string): EventCursor | null {
  try {
    const { t, i } = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof t !== 'string' || typeof i !== 'string' || !isUUID(i)) return null;
    const occurredAt = new Date(t);
    return isNaN(occurredAt.getTime()) || occurredAt.toISOString() !== t ? null : { occurredAt, id: i };
  } catch {
    return null;
  }
}
