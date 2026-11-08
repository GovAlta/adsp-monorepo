import { Logger } from 'winston';
import { AjvValidationService } from './ajv';

describe('ValidationService', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  it('can be created', () => {
    const service = new AjvValidationService(logger);
    expect(service).toBeTruthy();
  });

  it('can validate payload', () => {
    const service = new AjvValidationService(logger);

    const schema = { ype: 'object', properties: { valueA: { type: 'number' }, valueB: { type: 'string' } } };
    service.setSchema('test', schema);

    service.validate('test', 'test', { valueA: 123, valueB: 'value' });
  });

  it('can throw for invalid', () => {
    const service = new AjvValidationService(logger);

    const schema = { type: 'object', properties: { valueA: { type: 'number' } }, additionalProperties: false };
    service.setSchema('test', schema);

    expect(() => service.validate('test', 'test', { valueA: 123, valueB: 'value' })).toThrow(/Value not valid for/);
  });

  // Async schema changes the behavior of Ajv to return a promise instead (which is truthy),
  // so malicious configuration could trip up consuming code.
  it('can throw for async schema', () => {
    const service = new AjvValidationService(logger);

    expect(() =>
      service.setSchema('test', { $async: true, type: 'object', properties: { valueA: { type: 'string' } } })
    ).toThrow();
  });

  it('can set draft-04 json schema', () => {
    const service = new AjvValidationService(logger);
    const schema = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      title: 'DictionaryOfStringAndScriptDefinition',
      type: 'object',
      additionalProperties: {
        $ref: '#/definitions/ScriptDefinition',
      },
      definitions: {
        ScriptDefinition: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'name', 'script'],
          properties: {
            id: {
              type: 'string',
              minLength: 1,
            },
            name: {
              type: 'string',
              minLength: 1,
            },
            description: {
              type: ['null', 'string'],
            },
            script: {
              type: 'string',
              minLength: 1,
            },
            includeValuesInEvent: {
              type: ['boolean', 'null'],
            },
            useServiceAccount: {
              type: ['boolean', 'null'],
            },
            runnerRoles: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            triggerEvents: {
              type: 'array',
              items: {
                $ref: '#/definitions/EventIdentity',
              },
            },
          },
        },
        EventIdentity: {
          type: 'object',
          additionalProperties: false,
          required: ['namespace', 'name'],
          properties: {
            namespace: {
              type: 'string',
              minLength: 1,
            },
            name: {
              type: 'string',
              minLength: 1,
            },
            criteria: {
              oneOf: [
                {
                  type: 'null',
                },
                {
                  $ref: '#/definitions/EventIdentityCriteria',
                },
              ],
            },
          },
        },
        EventIdentityCriteria: {
          type: 'object',
          additionalProperties: false,
          properties: {
            correlationId: {
              type: ['null', 'string'],
            },
            context: {
              type: ['null', 'object'],
              additionalProperties: {},
            },
          },
        },
      },
    };
    service.setSchema('test', schema);
  });

  it('validates phone format', () => {
    const service = new AjvValidationService(logger);
    const schema = { type: 'object', properties: { phone: { type: 'string', format: 'phone' } } };
    service.setSchema('test', schema);

    service.validate('test', 'test', { phone: '(780) 123-4567' });
    service.validate('test', 'test', { phone: '7801234567' });
    expect(() => service.validate('test', 'test', { phone: 'notaphone' })).toThrow(/Value not valid for/);
  });

  it('removes empty enum to prevent comparison against third party content', () => {
    const service = new AjvValidationService(logger);
    const schema = {
      type: 'object',
      properties: {
        FileUploader2: {
          description: 'file uploader !!!',
          format: 'file-urn',
          type: 'string',
        },
        carBrands: {
          type: 'string',
          enum: [''],
        },
        countries: {
          type: 'string',
          enum: [''],
        },
        dogBreeds: {
          type: 'string',
          enum: [''],
        },
        basketballPlayers: {
          type: 'string',
          enum: [''],
        },
      },
    };

    const cleanedSchema: Record<string, any> = service.removeEmptyEnum(schema); // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(cleanedSchema.properties.carBrands.enum).toBe(undefined);
    expect(cleanedSchema.properties.countries.enum).toBe(undefined);
    expect(cleanedSchema.properties.dogBreeds.enum).toBe(undefined);
    expect(cleanedSchema.properties.basketballPlayers.enum).toBe(undefined);

    service.setSchema('test', schema);
  });

  describe('named input formats of the form renderer', () => {
    const schemaFor = (format: string) => ({ type: 'object', properties: { value: { type: 'string', format } } });

    it.each([
      ['sin', '046 454 286'],
      ['postalCode', 'T5J 2Z4'],
      ['driverId', '123456-789'],
      ['mvid', '1234-56789'],
    ])('accepts a valid %s value', (format, value) => {
      const service = new AjvValidationService(logger);
      service.setSchema('form', schemaFor(format));

      expect(() => service.validate('form submission', 'form', { value })).not.toThrow();
    });

    it.each([
      ['sin', '046454286'],
      ['postalCode', 'T5J2Z4'],
      ['driverId', '123456789'],
      ['mvid', '1234-5678'],
    ])('rejects a malformed %s value', (format, value) => {
      const service = new AjvValidationService(logger);
      service.setSchema('form', schemaFor(format));

      expect(() => service.validate('form submission', 'form', { value })).toThrow(/Value not valid for/);
    });

    it.each(['sin', 'postalCode', 'driverId', 'mvid'])('accepts an empty %s value for a field left blank', (format) => {
      const service = new AjvValidationService(logger);
      service.setSchema('form', schemaFor(format));

      expect(() => service.validate('form submission', 'form', { value: '' })).not.toThrow();
    });

    it('rejects a SIN with an invalid checksum', () => {
      const service = new AjvValidationService(logger);
      service.setSchema('form', schemaFor('sin'));

      expect(() => service.validate('form submission', 'form', { value: '046 454 287' })).toThrow(/Value not valid for/);
    });
  });
});
