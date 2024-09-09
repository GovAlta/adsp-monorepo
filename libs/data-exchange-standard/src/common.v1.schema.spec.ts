import Ajv from 'ajv';
import * as common from './common.v1.schema.json';
import * as standard from './standard.v1.schema.json';

describe('common.v1.schema', () => {
  it('is valid json schema', () => {
    const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log' });
    const result = ajv.validateSchema(common);
    expect(result).toBe(true);
  });

  it('can be referenced to validate', () => {
    const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log' });
    ajv.addSchema(standard);
    ajv.addSchema(common);
    ajv.addSchema(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { $ref: 'https://adsp.alberta.ca/common.v1.schema.json#/definitions/personFullName' },
        },
      },
      'form'
    );

    let result = ajv.validate('form', {
      name: {
        firstName: 'A.',
        middleName: 'N.',
        lastName: 'Other',
      },
    });
    expect(result).toBe(true);

    result = ajv.validate('form', {
      name: {
        firstName: 'AN',
      },
    });
    expect(result).toBe(false);
  });
});
