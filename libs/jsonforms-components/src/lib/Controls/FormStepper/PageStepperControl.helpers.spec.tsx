import { getByJsonPointer, hasDataValue, getCategoryScopes, hasDataInScopes } from './PageStepperControl';

describe('PageStepperControl helper functions', () => {
  describe('getByJsonPointer', () => {
    it('returns undefined for non-record or invalid pointer', () => {
      expect(getByJsonPointer(undefined, '')).toBeUndefined();
      expect(getByJsonPointer({}, '')).toBeUndefined();
      expect(getByJsonPointer({ a: 1 }, '/a')).toBeUndefined();
    });

    it('retrieves nested values and skips "properties" parts', () => {
      interface TestData {
        name: {
          first: string;
          nested: {
            x: number;
          };
        };
        tags: number[];
      }
      const data: TestData = { name: { first: 'Alice', nested: { x: 1 } }, tags: [1, 2] };
      expect(getByJsonPointer(data, '#/properties/name/properties/first')).toBe('Alice');
      expect(getByJsonPointer(data, '#/name/first')).toBe('Alice');
      expect(getByJsonPointer(data, '#/properties/name/properties/nested/properties/x')).toBe(1);
      expect(getByJsonPointer(data, '#/tags/0')).toBeUndefined(); // numeric keys treated as property names
    });
  });

  describe('hasDataValue', () => {
    it('handles primitives correctly', () => {
      expect(hasDataValue('')).toBe(false);
      expect(hasDataValue('  ')).toBe(false);
      expect(hasDataValue('ok')).toBe(true);
      expect(hasDataValue(0)).toBe(true);
      expect(hasDataValue(false)).toBe(true);
    });

    it('handles arrays and objects', () => {
      expect(hasDataValue([])).toBe(false);
      expect(hasDataValue([1])).toBe(true);

      expect(hasDataValue({})).toBe(false);
      expect(hasDataValue({ a: '' })).toBe(false);
      expect(hasDataValue({ a: 'x' })).toBe(true);
      expect(hasDataValue({ country: 'CA' }, 'country')).toBe(false); // ignored default key
    });
  });

  describe('getCategoryScopes', () => {
    it('returns scopes only when valid', () => {
      expect(getCategoryScopes(undefined)).toEqual([]);
      expect(getCategoryScopes({ scopes: 'no' })).toEqual([]);
      expect(getCategoryScopes({ scopes: [1, 2] })).toEqual([]);
      expect(getCategoryScopes({ scopes: ['#/a', '#/b'] })).toEqual(['#/a', '#/b']);
    });
  });

  describe('hasDataInScopes', () => {
    it('returns false for empty scopes and true when a pointer has data', () => {
      interface ScopeTestData {
        a: number;
        b: string;
        nested: {
          s: string;
        };
        tags: unknown[];
      }
      const data: ScopeTestData = { a: 1, b: '', nested: { s: 'x' }, tags: [] };
      expect(hasDataInScopes(data, [])).toBe(false);
      expect(hasDataInScopes(data, undefined)).toBe(false);
      expect(hasDataInScopes(data, ['#/a'])).toBe(true);
      expect(hasDataInScopes(data, ['#/b'])).toBe(false);
      expect(hasDataInScopes(data, ['#/properties/nested/properties/s'])).toBe(true);
      expect(hasDataInScopes(data, ['#/tags'])).toBe(false);
    });
  });
});
