import { resolveScope, evaluateSum, evaluateExpression } from './CalculationEngine';

describe('CalculationEngine', () => {
  const data = {
    x: 2,
    y: 3,
    z: 4,
    arr: [{ c3: 5 }, { c3: 10 }],
    nested: {
      arr: [{ c3: 1 }, { c3: 2 }],
    },
    mixed: [{ v: 1 }, { v: 'not-number' }],
  };

  describe('resolveScope', () => {
    it('resolves top-level property with properties prefix', () => {
      expect(resolveScope('#/properties/x', data)).toBe(2);
    });

    it('resolves array index paths', () => {
      expect(resolveScope('#/arr/0/c3', data)).toBe(5);
      expect(resolveScope('#/nested/arr/1/c3', data)).toBe(2);
    });

    it('returns undefined for missing path', () => {
      expect(resolveScope('#/properties/missing', data)).toBeUndefined();
    });
  });

  describe('evaluateSum', () => {
    const data = {
      arr: [{ c3: 1 }, { c3: 2 }, { c3: 3 }],
    };

    it('returns the sum of numbers in array column', () => {
      const result = evaluateSum('#/properties/arr/c3', data);

      expect(result.value).toBe(6);
      expect(result.error).toBeUndefined();
    });

    it('returns undefined when array is missing but no error (design-time OK, runtime just empty)', () => {
      const result = evaluateSum('#/properties/arr/c3', {});

      expect(result.value).toBeUndefined();
    });

    it('returns an error when items are not numbers', () => {
      const badData = {
        arr: [{ c3: 1 }, { c3: 'not-number' }],
      };

      const result = evaluateSum('#/properties/arr/c3', badData);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/c3/i);
    });

    it('returns an error when scope format is invalid', () => {
      const result = evaluateSum('not-a-scope', data);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/scope/i);
    });
  });

  describe('evaluateExpression', () => {
    const baseData = {
      x: 2,
      y: 3,
      z: 4,
      arr: [{ c3: 1 }, { c3: 2 }, { c3: 3 }],
    };

    it('returns undefined with no error when expression is empty', () => {
      const result = evaluateExpression('', baseData);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('computes a normal arithmetic expression with scopes', () => {
      const expression = '#/properties/x * #/properties/y + #/properties/z';

      const result = evaluateExpression(expression, baseData);

      // 2 * 3 + 4 = 10
      expect(result.value).toBe(10);
      expect(result.error).toBeUndefined();
    });

    it('supports SUM() expression', () => {
      const expression = 'SUM(#/properties/arr/c3)';

      const result = evaluateExpression(expression, baseData);

      expect(result.value).toBe(6);
      expect(result.error).toBeUndefined();
    });

    it('does not show error when nothing is filled yet (all variables undefined)', () => {
      const emptyData = {};
      const expression = '#/properties/x * #/properties/y + #/properties/z';

      const result = evaluateExpression(expression, emptyData);

      expect(result.value).toBeUndefined();
      expect(result.error).toBe('Please provide values for: #/properties/x, #/properties/y, #/properties/z');
    });

    it('still no error if some variables filled and others empty, but cannot compute', () => {
      const partialData = { x: 2 }; // y and z missing
      const expression = '#/properties/x * #/properties/y + #/properties/z';

      const result = evaluateExpression(expression, partialData);

      expect(result.value).toBeUndefined();
      expect(result.error).toBe('Please provide values for: #/properties/y, #/properties/z');
    });

    it('returns an error when expression contains an invalid scope (typo in designer config)', () => {
      const expression = '#/properties/x * #/properties/badField + 1';

      const result = evaluateExpression(expression, baseData);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/badField|scope/i);
    });

    it('ignores non-numeric SUM items with a clear error', () => {
      const badData = {
        arr: [{ c3: 1 }, { c3: 'oops' }],
      };
      const expression = 'SUM(#/properties/arr/c3)';

      const result = evaluateExpression(expression, badData);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});
