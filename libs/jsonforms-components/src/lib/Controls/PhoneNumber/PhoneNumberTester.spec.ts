import { JsonSchema, TesterContext, UISchemaElement } from '@jsonforms/core';
import { PhoneNumberTester } from './PhoneNumberTester';

const controlUischema: UISchemaElement = { type: 'Control', scope: '#/properties/phone' };
const ctx = { rootSchema: {}, config: {} } as TesterContext;

describe('PhoneNumberTester', () => {
  it('ranks 4 for a string schema with phone format', () => {
    const schema: JsonSchema = { type: 'string', format: 'phone' };
    expect(PhoneNumberTester(controlUischema, schema, ctx)).toBe(4);
  });

  it('returns -1 for a string schema with a different format', () => {
    const schema: JsonSchema = { type: 'string', format: 'email' };
    expect(PhoneNumberTester(controlUischema, schema, ctx)).toBe(-1);
  });

  it('returns -1 for a string schema without a format', () => {
    const schema: JsonSchema = { type: 'string' };
    expect(PhoneNumberTester(controlUischema, schema, ctx)).toBe(-1);
  });

  it('returns -1 for a non-string schema with phone format', () => {
    const schema: JsonSchema = { type: 'object', format: 'phone' };
    expect(PhoneNumberTester(controlUischema, schema, ctx)).toBe(-1);
  });

  it('returns -1 for a non-Control uischema', () => {
    const schema: JsonSchema = { type: 'string', format: 'phone' };
    const layout: UISchemaElement = { type: 'VerticalLayout' };
    expect(PhoneNumberTester(layout, schema, ctx)).toBe(-1);
  });
});
