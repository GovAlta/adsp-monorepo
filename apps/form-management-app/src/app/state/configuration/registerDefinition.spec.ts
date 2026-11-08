import { isRegisterDefinition } from './registerDefinition';

describe('isRegisterDefinition', () => {
  it('accepts a register whose items are anyOf string and object', () => {
    expect(
      isRegisterDefinition({
        configurationSchema: { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'object' }] } },
      }),
    ).toBe(true);
  });

  it('accepts anyOf string and object in either order', () => {
    expect(
      isRegisterDefinition({
        configurationSchema: { type: 'array', items: { anyOf: [{ type: 'object' }, { type: 'string' }] } },
      }),
    ).toBe(true);
  });

  it.each(['string', 'object'])('accepts a register whose items.type is %s', (type) => {
    expect(isRegisterDefinition({ configurationSchema: { type: 'array', items: { type } } })).toBe(true);
  });

  it.each([
    ['an object definition', { configurationSchema: { type: 'object' } }],
    ['an array of numbers', { configurationSchema: { type: 'array', items: { type: 'number' } } }],
    ['an array without items', { configurationSchema: { type: 'array' } }],
    ['an anyOf of string only', { configurationSchema: { type: 'array', items: { anyOf: [{ type: 'string' }] } } }],
    [
      'an anyOf with other types',
      {
        configurationSchema: {
          type: 'array',
          items: { anyOf: [{ type: 'string' }, { type: 'object' }, { type: 'number' }] },
        },
      },
    ],
    ['a definition without a schema', {}],
    ['a missing definition', undefined],
  ])('rejects %s', (_description, config) => {
    expect(isRegisterDefinition(config)).toBe(false);
  });
});
