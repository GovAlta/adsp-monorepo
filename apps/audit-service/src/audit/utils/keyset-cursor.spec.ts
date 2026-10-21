import { decodeKeysetCursor, encodeKeysetCursor } from './keyset-cursor';

const id = '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11';

describe('keyset cursor', () => {
  it('round-trips the ordering key of the last row', () => {
    const timestamp = new Date('2026-10-01T10:00:00.123Z');
    expect(decodeKeysetCursor(encodeKeysetCursor(timestamp, id))).toEqual({ timestamp, id });
  });

  it.each([
    '',
    'abc',
    Buffer.from('20').toString('base64'),
    Buffer.from(JSON.stringify({ t: 'yesterday', i: id })).toString('base64url'),
    Buffer.from(JSON.stringify({ t: '2026-10-01T10:00:00.000Z', i: 'not-a-uuid' })).toString('base64url'),
    Buffer.from(JSON.stringify({ t: '2026-10-01', i: id })).toString('base64url'),
  ])('rejects malformed cursor %p', (value) => {
    expect(decodeKeysetCursor(value)).toBeNull();
  });
});
