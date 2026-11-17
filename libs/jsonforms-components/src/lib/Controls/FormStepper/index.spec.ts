import { JsonSchema } from '@jsonforms/core';
import { getEmptyRequiredStringErrors } from './index';

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    person: {
      type: 'object',
      properties: { email: { type: 'string' } },
      required: ['email'],
    },
  },
  required: ['name', 'age'],
} as JsonSchema;

describe('getEmptyRequiredStringErrors', () => {
  it('returns no errors when required strings are filled in', () => {
    expect(getEmptyRequiredStringErrors({ name: 'a', person: { email: 'b' } }, schema)).toEqual([]);
  });

  it('reports a top level required string left empty', () => {
    const errors = getEmptyRequiredStringErrors({ name: '', person: { email: 'b' } }, schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].instancePath).toBe('/name');
  });

  it('reports an empty required string in a nested object', () => {
    const errors = getEmptyRequiredStringErrors({ name: 'a', person: { email: '' } }, schema);
    expect(errors.map((error) => error.instancePath)).toEqual(['/person/email']);
  });

  it('ignores missing values and non string required properties', () => {
    expect(getEmptyRequiredStringErrors({ age: undefined }, schema)).toEqual([]);
  });
});
