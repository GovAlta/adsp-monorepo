'use strict';

const { SESSIONS, BUSINESS_MODELS, MESSAGES, HYPOTHESES, PATTERNS, AUDIT_EVENTS, USERS, uuidv4, now, ts, paginate } = require('./store');

describe('store helpers', () => {
  describe('uuidv4', () => {
    it('returns a v4 UUID string', () => {
      const id = uuidv4();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('returns unique values on each call', () => {
      expect(uuidv4()).not.toBe(uuidv4());
    });
  });

  describe('now', () => {
    it('returns a valid ISO-8601 string', () => {
      const result = now();
      expect(typeof result).toBe('string');
      expect(() => new Date(result).toISOString()).not.toThrow();
    });
  });

  describe('ts', () => {
    it('returns an ISO string with no offset (present moment)', () => {
      const result = ts(0);
      expect(typeof result).toBe('string');
      expect(new Date(result).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('returns a timestamp in the past when offsetMs > 0', () => {
      const before = ts(60000);
      expect(new Date(before).getTime()).toBeLessThan(Date.now() - 59000);
    });
  });

  describe('paginate', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);

    it('returns first page with correct slice', () => {
      const result = paginate(items, 1, 10);
      expect(result.items).toHaveLength(10);
      expect(result.items[0]).toBe(0);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('returns second page', () => {
      const result = paginate(items, 2, 10);
      expect(result.items[0]).toBe(10);
      expect(result.items).toHaveLength(10);
    });

    it('clamps pageSize to 100', () => {
      const result = paginate(items, 1, 999);
      expect(result.pageSize).toBe(100);
    });

    it('defaults page to 1 and pageSize to 20 when undefined', () => {
      const result = paginate(items);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('clamps page to 1 for invalid values', () => {
      const result = paginate(items, -5, 5);
      expect(result.page).toBe(1);
    });
  });
});

describe('store seed data', () => {
  it('SESSIONS is a non-empty array', () => {
    expect(Array.isArray(SESSIONS)).toBe(true);
    expect(SESSIONS.length).toBeGreaterThan(0);
  });

  it('BUSINESS_MODELS is an object with keys', () => {
    expect(typeof BUSINESS_MODELS).toBe('object');
    expect(Object.keys(BUSINESS_MODELS).length).toBeGreaterThan(0);
  });

  it('MESSAGES is an object', () => {
    expect(typeof MESSAGES).toBe('object');
  });

  it('HYPOTHESES is an object', () => {
    expect(typeof HYPOTHESES).toBe('object');
  });

  it('PATTERNS is a non-empty array', () => {
    expect(Array.isArray(PATTERNS)).toBe(true);
    expect(PATTERNS.length).toBeGreaterThan(0);
  });

  it('AUDIT_EVENTS is an array', () => {
    expect(Array.isArray(AUDIT_EVENTS)).toBe(true);
  });

  it('USERS is a non-empty array', () => {
    expect(Array.isArray(USERS)).toBe(true);
    expect(USERS.length).toBeGreaterThan(0);
  });
});
