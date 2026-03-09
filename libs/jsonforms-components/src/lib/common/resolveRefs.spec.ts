import { JsonSchema, JsonSchema7 } from '@jsonforms/core';
import { resolveRefs, tryResolveRefs } from './resolveRefs';
import { createSchemaMatchTester, createSchemaMatchRankedTester } from './tester';

describe('resolveRefs', () => {
  it('can resolve refs', async () => {
    const result = await resolveRefs(
      {
        type: 'object',
        properties: {
          test: { $ref: 'https://test.org/common.v1.json' },
        },
      },
      {
        $id: 'https://test.org/common.v1.json',
        type: 'object',
      }
    );

    expect((result.properties?.test as JsonSchema).type).toBe('object');
  });

  it('can fail for unknown refs', async () => {
    await expect(
      resolveRefs(
        {
          type: 'object',
          properties: {
            test: { $ref: 'https://test.org/additional.v1.json' },
          },
        },
        {
          $id: 'https://test.org/common.v1.json',
          type: 'object',
        }
      )
    ).rejects.toThrowError(Error);
  });

  it('can resolve refs to property', async () => {
    const result = await resolveRefs(
      {
        type: 'object',
        properties: {
          test: { $ref: 'https://test.org/common.v1.json#/properties/commonTest' },
        },
      },
      {
        $id: 'https://test.org/common.v1.json',
        type: 'object',
        properties: {
          commonTest: {
            type: 'string',
          },
        },
      }
    );

    expect((result.properties?.test as JsonSchema).type).toBe('string');
  });

  it('can resolve refs using schema v4 id fallback', async () => {
    const result = await resolveRefs(
      {
        type: 'object',
        properties: {
          test: { $ref: 'https://test.org/v4-common.json' },
        },
      },
      {
        id: 'https://test.org/v4-common.json',
        type: 'object',
      } as JsonSchema
    );

    expect((result.properties?.test as JsonSchema).type).toBe('object');
  });

  it('can resolve inner refs', async () => {
    const result = await resolveRefs(
      {
        type: 'object',
        properties: {
          test: { $ref: 'https://test.org/common.v1.json#/properties/commonTest' },
        },
      },
      {
        $id: 'https://test.org/common.v1.json',
        type: 'object',
        properties: {
          commonTest: {
            $ref: '#/definitions/internal',
          },
        },
        definitions: {
          internal: {
            type: 'string',
          },
        },
      } as JsonSchema7
    );

    expect((result.properties?.test as JsonSchema).type).toBe('string');
  });

  it('can try resolve ref', async () => {
    const [result, error] = await tryResolveRefs(
      {
        type: 'object',
        properties: {
          test: { $ref: 'https://test.org/common.v1.json' },
        },
      },
      {
        $id: 'https://test.org/common.v1.json',
        type: 'object',
      }
    );

    expect((result.properties?.test as JsonSchema).type).toBe('object');
    expect(error).toBeUndefined();
  });

  it('can try resolve ref and fallback', async () => {
    const [result, error] = await tryResolveRefs(
      {
        type: 'object',
        properties: {
          test: { $ref: 'https://test.org/common.v1.json#missing' },
        },
      },
      {
        $id: 'https://test.org/common.v1.json',
        type: 'object',
      }
    );

    expect((result.properties?.test as JsonSchema).$ref).toBe('https://test.org/common.v1.json#missing');
    expect((result.properties?.test as JsonSchema).type).toBeUndefined();
    expect(error).toEqual(expect.any(Error));
  });

  it('throws when dereference is unavailable from parser module', async () => {
    jest.resetModules();
    jest.doMock('@apidevtools/json-schema-ref-parser', () => ({}));

    const module = await import('./resolveRefs');

    await expect(module.resolveRefs({ type: 'object' })).rejects.toThrow(
      '@apidevtools/json-schema-ref-parser is required for use of resolveRefs().'
    );

    jest.dontMock('@apidevtools/json-schema-ref-parser');
  });
});

describe('schema match testers', () => {
  it('supports exact and partial schema property matching', () => {
    const partialTester = createSchemaMatchTester(['firstName']);
    const exactTester = createSchemaMatchTester(['firstName'], true);

    const partialScore = partialTester(
      {} as any,
      {
        type: 'object',
        properties: { firstName: { type: 'string' }, lastName: { type: 'string' } },
      } as JsonSchema,
      undefined as any
    );
    const exactScore = exactTester(
      {} as any,
      {
        type: 'object',
        properties: { firstName: { type: 'string' } },
      } as JsonSchema,
      undefined as any
    );
    const missScore = exactTester(
      {} as any,
      {
        type: 'object',
        properties: { firstName: { type: 'string' }, lastName: { type: 'string' } },
      } as JsonSchema,
      undefined as any
    );

    expect(partialScore).toBeGreaterThan(-1);
    expect(exactScore).toBeGreaterThan(-1);
    expect(missScore).toBe(-1);
  });

  it('returns ranked score for matching schema', () => {
    const rankedTester = createSchemaMatchRankedTester(['email']);
    const ranked = rankedTester(
      {} as any,
      {
        type: 'object',
        properties: { email: { type: 'string' } },
      } as JsonSchema,
      undefined as any
    );

    expect(ranked).toBe(4);
  });
});
