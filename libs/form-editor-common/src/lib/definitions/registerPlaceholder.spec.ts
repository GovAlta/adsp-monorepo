import { isEnumControl } from '@jsonforms/core';
import Ajv from 'ajv';
import { clearRegisterPlaceholders } from './registerPlaceholder';

// Same options as the editor's createDefaultAjv that matter here.
const createAjv = () => new Ajv({ allErrors: true, strict: 'log', strictRequired: false });

describe('clearRegisterPlaceholders', () => {
  const schema = {
    type: 'object',
    properties: {
      ministry: { type: 'string', enum: [''] },
      province: { type: 'string', enum: ['AB', 'BC'] },
      name: { type: 'string' },
    },
    required: ['ministry'],
  };

  it('rejects a register selection while the placeholder enum is in the schema', () => {
    const data = { ministry: 'HLTH', province: 'AB' };

    const valid = createAjv().validate(schema, data);

    expect(valid).toBe(false);
  });

  it('accepts a register selection once the placeholder is cleared', () => {
    const data = { ministry: 'HLTH', province: 'AB' };

    const valid = createAjv().validate(clearRegisterPlaceholders(schema), data);

    expect(valid).toBe(true);
  });

  it('keeps the register field rendered as a dropdown', () => {
    const cleared = clearRegisterPlaceholders(schema);

    const isDropdown = isEnumControl({ type: 'Control', scope: '#/properties/ministry' }, cleared, {
      rootSchema: cleared,
      config: {},
    });

    expect(isDropdown).toBe(true);
  });

  it('still validates enums that list real values', () => {
    const data = { ministry: 'HLTH', province: 'ON' };

    const valid = createAjv().validate(clearRegisterPlaceholders(schema), data);

    expect(valid).toBe(false);
  });

  it('keeps the required list', () => {
    const cleared = clearRegisterPlaceholders(schema);

    expect(cleared.required).toEqual(['ministry']);
  });

  it('does not modify the schema it is given', () => {
    clearRegisterPlaceholders(schema);

    expect(schema.properties.ministry.enum).toEqual(['']);
  });

  it('returns a new but equal schema when there is no placeholder', () => {
    const plain = { type: 'object', properties: { name: { type: 'string' } } };

    const cleared = clearRegisterPlaceholders(plain);

    expect(cleared).not.toBe(plain);
    expect(cleared).toEqual(plain);
  });
});
