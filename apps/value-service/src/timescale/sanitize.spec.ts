import { stripNul } from './sanitize';

const NUL = '\u0000';

describe('stripNul', () => {
  it('can remove a nul from a string', () => {
    expect(stripNul(`before${NUL}after`)).toBe('beforeafter');
  });

  it('can remove the nul that a six-digit escape decodes to', () => {
    // `\u000027` is `\u0027` written with two extra zeros. JSON reads four hex digits, so it decodes
    // to U+0000 followed by a literal "27". This is the shape found in adsp-dev.
    const decoded = JSON.parse('"We\\u000027re here"');

    expect(decoded).toContain(NUL);
    expect(stripNul(decoded)).toBe('We27re here');
  });

  it('can clean nested objects and arrays', () => {
    const input = { a: [`x${NUL}`, { b: `y${NUL}z` }], c: 1, d: null };

    expect(stripNul(input)).toEqual({ a: ['x', { b: 'yz' }], c: 1, d: null });
  });

  it('can clean object keys', () => {
    const input = { [`key${NUL}`]: 'value' };

    expect(Object.keys(stripNul(input))).toEqual(['key']);
  });

  it('can return the same reference when there is nothing to strip', () => {
    // Callers rely on reference equality to decide whether to warn, and to avoid copying.
    const input = { a: ['x', { b: 'y' }], c: 1 };

    expect(stripNul(input)).toBe(input);
  });

  it('can leave non-string primitives alone', () => {
    expect(stripNul(42)).toBe(42);
    expect(stripNul(true)).toBe(true);
    expect(stripNul(null)).toBeNull();
    expect(stripNul(undefined)).toBeUndefined();
  });

  it('can leave a Date intact', () => {
    const date = new Date('2026-08-27T00:00:00Z');

    expect(stripNul(date)).toBe(date);
  });
});
