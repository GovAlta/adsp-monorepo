import { resolveScope, evaluateSum, evaluateExpression, collectScopes } from './CalculationEngine';
import { JsonSchema } from '@jsonforms/core';
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
      expect(result.error).toMatch('SUM requires array/column path like #/properties/arr/c3');
    });
  });

  describe('evaluateExpression', () => {
    it('returns value for a valid simple expression', () => {
      const data = {
        x: 2,
        y: 3,
        z: 4,
      };

      const expr = '#/properties/x * #/properties/y + #/properties/z';

      const result = evaluateExpression(expr, data);

      expect(result.error).toBeUndefined();
      expect(result.value).toBe(2 * 3 + 4); // 10
    });

    it('returns value for a SUM() over an array column', () => {
      const data = {
        arr: [{ c3: 1 }, { c3: 2 }, { c3: 3 }],
      };

      const expr = 'SUM(#/properties/arr/c3)';

      const result = evaluateExpression(expr, data);

      expect(result.error).toBeUndefined();
      expect(result.value).toBe(6);
    });

    it('reports missing values when referenced scopes exist but are undefined/null', () => {
      const data = {
        // x is present
        x: 2,
        // y and z are missing (undefined)
      };

      const expr = '#/properties/x * #/properties/y + #/properties/z';

      const result = evaluateExpression(expr, data);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      // loosen the expectation to avoid exact-string brittleness
      expect(result.error).toContain('Please provide values for');
      expect(result.error).toContain('#/properties/y');
      expect(result.error).toContain('#/properties/z');
      // and *not* complain about x as missing
      expect(result.error).not.toContain('#/properties/x');
    });

    it('reports invalid scopes when a referenced path does not exist', () => {
      const data = {
        x: 2,
        y: 3,
        // no "doesNotExist" anywhere
      };

      const expr = '#/properties/x + #/properties/doesNotExist';

      const result = evaluateExpression(expr, data);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      // Again, keep expectations flexible
      expect(result.error).toBe('Please provide values for: #/properties/doesNotExist');
      expect(result.error).toContain('#/properties/doesNotExist');
    });

    it('treats invalid scopes in the middle or end of expression the same', () => {
      const data = {
        x: 1,
        y: 2,
        z: 3,
      };

      const expr = '#/properties/x + #/properties/y + #/properties/doesNotExist';

      const result = evaluateExpression(expr, data);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toBe('Please provide values for: #/properties/doesNotExist');
      expect(result.error).toContain('#/properties/doesNotExist');
    });

    it('reports invalid expression syntax', () => {
      const data = {
        x: 2,
        y: 3,
      };

      const expr = '#/properties/x *** #/properties/y'; // invalid operator

      const result = evaluateExpression(expr, data);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/invalid expression syntax/i);
    });

    it('returns undefined for empty or whitespace-only expression without error', () => {
      const data = {
        x: 1,
      };

      const result1 = evaluateExpression('', data);
      const result2 = evaluateExpression('   ', data);
      const result3 = evaluateExpression(null as unknown as string, data);

      [result1, result2, result3].forEach((r) => {
        expect(r.value).toBeUndefined();
        expect(r.error).toBeUndefined();
      });
    });

    it('ignores non-scope text and still evaluates correctly', () => {
      const data = {
        x: 5,
      };

      const expr = '#/properties/x + 10';

      const result = evaluateExpression(expr, data);

      expect(result.error).toBeUndefined();
      expect(result.value).toBe(15);
    });

    it('returns error when SUM() column contains non-numeric data', () => {
      const data = {
        arr: [{ c3: 1 }, { c3: 'not-a-number' }],
      };

      const expr = 'SUM(#/properties/arr/c3)';

      const result = evaluateExpression(expr, data);

      expect(result.value).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toBe('Please provide values for: #/properties/arr/c3');
    });
  });
  describe('collectScopes', () => {
    it('returns empty array for undefined schema', () => {
      // @ts-expect-no-error runtime will just get undefined
      const result = collectScopes(undefined);

      expect(result).toEqual([]);
    });

    it('returns empty array for non-object schema', () => {
      const schema = 42 as unknown as JsonSchema;

      const result = collectScopes(schema);

      expect(result).toEqual([]);
    });

    it('collects scopes for flat object properties', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
      };

      const result = collectScopes(schema);

      expect(result).toEqual(['#/properties/x', '#/properties/y']);
    });
  });
});
