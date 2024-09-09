import Ajv from 'ajv';
import * as standard from './standard.v1.schema.json';

describe('standard.v1.schema', () => {
  it('is valid json schema', () => {
    const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log' });
    const result = ajv.validateSchema(standard);
    expect(result).toBe(true);
  });

  it('can be referenced to validate', () => {
    const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log' });
    ajv.addSchema(standard);
    ajv.addSchema(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          address: { $ref: 'https://adsp.alberta.ca/standard.v1.schema.json#/definitions/postalAddress' },
        },
      },
      'form'
    );

    let result = ajv.validate('form', {
      address: {
        addressLine1: '123 fake st.',
        subdivisionCode: 'AB',
        postalCode: 'T1A 4L1',
        country: 'CA',
      },
    });
    expect(result).toBe(true);

    result = ajv.validate('form', {
      address: {
        subdivisionCode: 'AB',
        postalCode: 'T1A 4L1',
        country: 'CA',
      },
    });
    expect(result).toBe(false);
  });
});
