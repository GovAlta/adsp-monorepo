import isUUID from 'validator/lib/isUUID';

export interface KeysetCursor {
  timestamp: Date;
  id: string;
}

// Opaque keyset cursor over a (timestamp, id) ordering. Unlike an offset it is unaffected by rows
// inserted while a caller is paging.
export function encodeKeysetCursor(timestamp: Date | string, id: string): string {
  return Buffer.from(JSON.stringify({ t: new Date(timestamp).toISOString(), i: id })).toString('base64url');
}

export function decodeKeysetCursor(value: string): KeysetCursor | null {
  try {
    const { t, i } = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof t !== 'string' || typeof i !== 'string' || !isUUID(i)) return null;
    const timestamp = new Date(t);
    return isNaN(timestamp.getTime()) || timestamp.toISOString() !== t ? null : { timestamp, id: i };
  } catch {
    return null;
  }
}
