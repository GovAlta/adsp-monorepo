import { compareEntryIds, formatCursor, parseCursor } from './cursor';

describe('cursor', () => {
  it('can format and parse cursor', () => {
    const cursor = formatCursor('abc123', '1700000000000-2');
    expect(cursor).toBe('abc123.1700000000000-2');
    expect(parseCursor(cursor)).toEqual({ epoch: 'abc123', entryId: '1700000000000-2' });
  });

  it.each([undefined, null, 123, '', 'garbage', '.1-0', 'abc.not-an-id', 'abc.1'])(
    'can return null for invalid cursor %p',
    (value) => {
      expect(parseCursor(value)).toBeNull();
    },
  );

  it('can compare entry ids', () => {
    expect(compareEntryIds('1-0', '2-0')).toBeLessThan(0);
    expect(compareEntryIds('2-0', '1-5')).toBeGreaterThan(0);
    expect(compareEntryIds('2-1', '2-0')).toBeGreaterThan(0);
    expect(compareEntryIds('2-1', '2-1')).toBe(0);
    // Numeric, not lexical.
    expect(compareEntryIds('10-0', '9-0')).toBeGreaterThan(0);
  });
});
