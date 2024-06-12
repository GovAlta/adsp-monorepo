import Ajv from 'ajv';
import { validateData } from './validateData';

const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log' });
const nameSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
  required: ['firstName'],
};

describe('ValidateData', () => {
  it('will detect valid data', () => {
    const formData = { firstName: 'Bob', lastName: 'Bing' };
    const isValid = validateData(nameSchema, formData, ajv);
    expect(isValid).toBe(true);
  });

  it('will detect inValid data', () => {
    const formData = { firstName: undefined, lastName: 'Bing' };
    const isValid = validateData(nameSchema, formData, ajv);
    expect(isValid).toBe(false);
  });

  it('will ignore file-url format', () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        resume: { type: 'string', format: 'file-urn' },
      },
      required: ['firstName'],
    };
    const formData = { firstName: 'Bob', resume: 'Bing' };
    const isValid = validateData(schema, formData, ajv);
    expect(isValid).toBe(true);
  });

  it("won't ignore random format", () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        resume: { type: 'string', format: 'bobs-special-format' },
      },
      required: ['firstName'],
    };
    const formData = { firstName: 'Bob', resume: 'Bing' };
    const isValid = validateData(schema, formData, ajv);
    expect(isValid).toBe(false);
  });
});
