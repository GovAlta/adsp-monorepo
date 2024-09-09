import { JsonSchema, JsonSchema7 } from '@jsonforms/core';
import { resolveRefs, tryResolveRefs } from './resolveRefs';

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
});
