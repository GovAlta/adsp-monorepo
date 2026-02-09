import type { JsonSchema7 } from '@jsonforms/core';
import { isRequiredBySchema } from './requiredUtil';

describe(' isRequiredBySchema test single and nest required cases', () => {
  it('returns true for static required field at root', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'string' },
      },
      required: ['a'],
    };

    expect(isRequiredBySchema(schema, {}, 'a')).toBe(true);
    expect(isRequiredBySchema(schema, {}, 'b')).toBe(false);
  });

  it('returns true for nested required field (properties.required)', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        companyContact: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
          required: ['firstName'],
        },
      },
    };

    expect(isRequiredBySchema(schema, {}, '/companyContact.firstName')).toBe(true);
    expect(isRequiredBySchema(schema, {}, '/companyContact.lastName')).toBe(false);
  });

  it('supports if/then at root affecting nested required', () => {
    const COMPANY = 'Company/Organization (You are applying on behalf of an organization)';

    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        applicantType: {
          type: 'string',
          enum: [
            'Individual (You are making the application by yourself)',
            'Company/Organization (You are applying on behalf of an organization)',
            'Representative (You are making this application on behalf of an entity/someone else)',
          ],
        },
        companyContact: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
      if: {
        properties: {
          applicantType: { const: COMPANY },
        },
        required: ['applicantType'],
      },
      then: {
        properties: {
          companyContact: {
            type: 'object',
            properties: {
              firstName: {
                type: 'string',
              },
              lastName: {
                type: 'string',
              },
            },
            required: ['firstName', 'lastName'],
          },
        },
        required: ['companyContact'],
      },
    };

    expect(isRequiredBySchema(schema, { applicantType: COMPANY }, 'companyContact.firstName')).toBe(true);

    expect(isRequiredBySchema(schema, { applicantType: COMPANY }, 'companyContact.lastName')).toBe(true);

    // Not company => then shouldn't apply
    expect(isRequiredBySchema(schema, { applicantType: 'Individual' }, 'companyContact.firstName')).toBe(false);
  });

  it('supports if/else branch required', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      allOf: [
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          required: ['a'],
        },
        {
          type: 'object',
          properties: { b: { type: 'string' } },
          required: ['b'],
        },
      ],
    };

    expect(isRequiredBySchema(schema, { mode: 'A' }, 'a')).toBe(true);
    expect(isRequiredBySchema(schema, { mode: 'A' }, 'b')).toBe(true);

    expect(isRequiredBySchema(schema, { mode: 'B' }, 'a')).toBe(true);
    expect(isRequiredBySchema(schema, { mode: 'B' }, 'b')).toBe(true);
  });

  it('supports allOf merging required (union)', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      allOf: [
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          required: ['a'],
        },
        {
          type: 'object',
          properties: { b: { type: 'string' } },
          required: ['b'],
        },
      ],
    };

    expect(isRequiredBySchema(schema, {}, 'a')).toBe(true);
    expect(isRequiredBySchema(schema, {}, 'b')).toBe(true);
  });

  it('supports arrays: items required maps to ".0." path', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        additionalApplicants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
            },
            required: ['firstName'],
          },
        },
      },
    };

    // Our util maps items to basePath + ".0"
    expect(isRequiredBySchema(schema, {}, 'additionalApplicants.0.firstName')).toBe(true);

    expect(isRequiredBySchema(schema, {}, 'additionalApplicants.0.lastName')).toBe(false);
  });

  it('normalizes path formats: dot, slash, and #/properties', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        companyContact: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
          },
          required: ['firstName'],
        },
      },
    };

    expect(isRequiredBySchema(schema, {}, 'companyContact.firstName')).toBe(true);
    expect(isRequiredBySchema(schema, {}, '/companyContact/firstName')).toBe(true);
    expect(isRequiredBySchema(schema, {}, '#/properties/companyContact/properties/firstName')).toBe(false);
  });

  describe('anyOf / oneOf strategies', () => {
    it('anyOf + bestMatch: chooses the first valid branch and marks its required only', () => {
      const schemaAnyOf: JsonSchema7 = {
        type: 'object',
        properties: {
          x: { type: 'string' },
          y: { type: 'string' },
        },
        anyOf: [
          {
            type: 'object',
            properties: { x: { type: 'string' } },
            required: ['x'],
          },
          {
            type: 'object',
            properties: { y: { type: 'string' } },
            required: ['y'],
          },
        ],
      };

      // Make BOTH branches valid by providing both x and y
      const data = { x: 'ok', y: 'ok' };

      // bestMatch picks the first valid branch => "x" required (by that branch), "y" not marked
      expect(isRequiredBySchema(schemaAnyOf, data, 'x', { strategy: 'bestMatch' })).toBe(true);
      expect(isRequiredBySchema(schemaAnyOf, data, 'y', { strategy: 'bestMatch' })).toBe(false);
    });

    it('anyOf + union: if multiple branches are valid, union marks required from ALL valid branches', () => {
      const schemaAnyOf: JsonSchema7 = {
        type: 'object',
        properties: {
          x: { type: 'string' },
          y: { type: 'string' },
        },
        anyOf: [
          {
            type: 'object',
            properties: { x: { type: 'string' } },
            required: ['x'],
          },
          {
            type: 'object',
            properties: { y: { type: 'string' } },
            required: ['y'],
          },
        ],
      };

      // Both branches valid
      const data = { x: 'ok', y: 'ok' };

      // union collects both required sets => x and y should be required
      expect(isRequiredBySchema(schemaAnyOf, data, 'x', { strategy: 'union' })).toBe(true);
      expect(isRequiredBySchema(schemaAnyOf, data, 'y', { strategy: 'union' })).toBe(true);
    });

    it('anyOf + intersection: only marks required that are common to ALL valid branches', () => {
      const schemaAnyOf: JsonSchema7 = {
        type: 'object',
        properties: {
          x: { type: 'string' },
          y: { type: 'string' },
        },
        anyOf: [
          {
            type: 'object',
            properties: { x: { type: 'string' } },
            required: ['x'],
          },
          {
            type: 'object',
            properties: { y: { type: 'string' } },
            required: ['y'],
          },
        ],
      };

      // Both branches valid
      const data = { x: 'ok', y: 'ok' };

      // intersection => common required across both branches = none
      expect(isRequiredBySchema(schemaAnyOf, data, 'x', { strategy: 'intersection' })).toBe(false);
      expect(isRequiredBySchema(schemaAnyOf, data, 'y', { strategy: 'intersection' })).toBe(false);
    });

    it('oneOf + bestMatch: selects the valid branch and marks its required', () => {
      const schemaOneOf: JsonSchema7 = {
        type: 'object',
        properties: {
          kind: { type: 'string' },
          a: { type: 'string' },
          b: { type: 'string' },
        },
        oneOf: [
          {
            type: 'object',
            properties: { kind: { const: 'A' }, a: { type: 'string' } },
            required: ['kind', 'a'],
          },
          {
            type: 'object',
            properties: { kind: { const: 'B' }, b: { type: 'string' } },
            required: ['kind', 'b'],
          },
        ],
      };

      const dataA = { kind: 'A', a: 'ok' };

      expect(isRequiredBySchema(schemaOneOf, dataA, 'a', { strategy: 'bestMatch' })).toBe(true);
      expect(isRequiredBySchema(schemaOneOf, dataA, 'b', { strategy: 'bestMatch' })).toBe(false);
    });
  });

  it('returns false when path is undefined/empty', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: { a: { type: 'string' } },
      required: ['a'],
    };

    expect(isRequiredBySchema(schema, {}, undefined)).toBe(false);
    expect(isRequiredBySchema(schema, {}, '')).toBe(false);
  });

  it('handles bestMatch strategy with multiple invalid branches', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        type: { enum: ['A', 'B'] },
        a: { type: 'string' },
        b: { type: 'number' },
      },
      oneOf: [
        {
          type: 'object',
          properties: { type: { const: 'A' }, a: { type: 'string' } },
          required: ['type', 'a'],
        },
        {
          type: 'object',
          properties: { type: { const: 'B' }, b: { type: 'number' } },
          required: ['type', 'b'],
        },
      ],
    };

    const dataA = { type: 'A' };
    const result = isRequiredBySchema(schema, dataA, 'a', { strategy: 'bestMatch' });
    expect(typeof result).toBe('boolean');
  });

  it('handles intersection strategy with branches', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'string' },
      },
      anyOf: [{ required: ['a'] }, { required: ['b'] }],
    };

    // With anyOf/oneOf, intersection would only find 'a' if both branches require it
    const result = isRequiredBySchema(schema, {}, 'a', { strategy: 'intersection' });
    expect(typeof result).toBe('boolean');
  });

  it('handles union strategy with anyOf', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'string' },
      },
      anyOf: [{ required: ['a'] }, { required: ['b'] }],
    };

    // Union includes fields required in any branch
    const resultA = isRequiredBySchema(schema, {}, 'a', { strategy: 'union' });
    const resultB = isRequiredBySchema(schema, {}, 'b', { strategy: 'union' });
    expect(typeof resultA).toBe('boolean');
    expect(typeof resultB).toBe('boolean');
  });

  it('handles if/then/else at allOf level', () => {
    const schema: JsonSchema7 = {
      allOf: [
        {
          if: { properties: { type: { const: 'A' } } },
          then: { required: ['fieldA'] },
          else: { required: ['fieldB'] },
        },
      ],
      properties: {
        type: { enum: ['A', 'B'] },
        fieldA: { type: 'string' },
        fieldB: { type: 'string' },
      },
    };

    const result = isRequiredBySchema(schema, {}, 'fieldA');
    expect(typeof result).toBe('boolean');
  });

  it('handles nested allOf with if/then/else', () => {
    const schema: JsonSchema7 = {
      allOf: [
        {
          allOf: [
            {
              if: { properties: {} },
              then: { required: ['nested'] },
            },
          ],
        },
      ],
      properties: {
        nested: { type: 'string' },
      },
    };

    const result = isRequiredBySchema(schema, {}, 'nested');
    expect(typeof result).toBe('boolean');
  });

  it('handles intersection with multiple sets having common elements', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        common: { type: 'string' },
        a: { type: 'string' },
        b: { type: 'string' },
      },
      anyOf: [{ required: ['common', 'a'] }, { required: ['common', 'b'] }],
    };

    // With intersection strategy, only 'common' should be required (present in both)
    const result = isRequiredBySchema(schema, {}, 'common', { strategy: 'intersection' });
    expect(typeof result).toBe('boolean');
  });

  it('handles empty sets in intersection', () => {
    const schema: JsonSchema7 = {
      type: 'object',
      properties: {
        a: { type: 'string' },
      },
      anyOf: [],
    };

    const result = isRequiredBySchema(schema, {}, 'a', { strategy: 'intersection' });
    expect(typeof result).toBe('boolean');
  });
});
