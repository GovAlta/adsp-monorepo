import { decodeEventCursor, encodeEventCursor } from './event-cursor';

const id = '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11';

describe('event cursor', () => {
  it('maps the event ordering key to and from the shared keyset cursor', () => {
    const occurredAt = new Date('2026-10-01T10:00:00.123Z');
    expect(decodeEventCursor(encodeEventCursor({ id, occurred_at: occurredAt }))).toEqual({ occurredAt, id });
    expect(decodeEventCursor('abc')).toBeNull();
  });
});
