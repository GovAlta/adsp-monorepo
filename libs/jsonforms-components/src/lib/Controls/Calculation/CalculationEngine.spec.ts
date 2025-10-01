import { resolveScope, sumColumn, evaluateExpression } from './CalculationEngine';

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

  describe('sumColumn', () => {
    it('sums numeric column in array', () => {
      expect(sumColumn('#/properties/arr/c3', data)).toBe(15);
    });

    it('sums column with nested path', () => {
      expect(sumColumn('#/nested/arr/c3', data)).toBe(3);
    });

    it('returns undefined when array items are non-numeric', () => {
      expect(sumColumn('#/mixed/v', data)).toBeUndefined();
    });

    it('returns undefined for non-array target', () => {
      expect(sumColumn('#/properties/x/c3', data)).toBeUndefined();
    });
  });

  describe('evaluateExpression', () => {
    it('evaluates arithmetic expression with quoted scopes', () => {
      const expr = '"#/properties/x" * "#/properties/y" + "#/properties/z"';
      expect(evaluateExpression(expr, data)).toBe(10);
    });

    it('evaluates arithmetic expression with unquoted scopes', () => {
      const expr = '#/properties/x * #/properties/y + #/properties/z';
      expect(evaluateExpression(expr, data)).toBe(10);
    });

    it('evaluates SUM expression', () => {
      const expr = 'SUM("#/properties/arr/c3")';
      expect(evaluateExpression(expr, data)).toBe(15);
    });

    it('returns undefined when any referenced value is missing', () => {
      const expr = '"#/properties/x" * "#/properties/missing"';
      expect(evaluateExpression(expr, data)).toBeUndefined();
    });

    it('returns undefined when referenced value is not numeric', () => {
      const badData = { a: 'not-number' };
      const expr = '#/properties/a * 2';
      expect(evaluateExpression(expr, badData)).toBeUndefined();
    });
  });
});
