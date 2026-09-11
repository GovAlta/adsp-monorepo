import '@testing-library/jest-dom';
import { createDefaultAjv } from './Ajv';
import { invalidSin } from './Constants';

const testDefaultSchema = {
  type: 'object',
  properties: {
    readyToApply: {
      type: 'object',
      default: {},
      properties: {
        whichOfThemAppliesOther: {
          type: 'string',
          title: 'Describe your dispute in a few words',
        },
        whichOfThemApplies: {
          type: 'array',
          default: [],
          items: {
            type: 'string',
            enum: [
              'Access to condominium documents or records',
              'Issue with general meetings',
              'Problem with a fine for breaking condominium rules',
              'other',
            ],
          },
          minItems: 1,
          errorMessage: {
            minItems: 'errr',
          },
        },
        hasDisputeTakenCareOff: {
          type: 'string',
          title: 'Has this dispute already been taken to court?',
          enum: [
            'No, there are no other applications',
            'Yes, I have filed an application with the courts',
            'Yes, I have been served with an application from the courts',
            "I'm not sure",
          ],
        },
      },
      required: ['hasDisputeTakenCareOff', 'whichOfThemApplies'],
    },
  },
  required: ['readyToApply'],
};

describe('Ajv tests', () => {
  it('should create a default ajv instance', () => {
    const ajv = createDefaultAjv();
    expect(ajv).not.toBeNull();
  });

  it('can test file-urn using the ajv', () => {
    const ajv = createDefaultAjv();
    let valid = ajv.validate(
      {
        type: 'object',
        properties: {
          'file-urn': { type: 'string', format: 'file-urn' },
        },
      },
      {
        'file-urn': 'urn:ads:platfor:file-service:v1:/files/c7f1c6aa-3564-4541-a6f4-a0915dcb8906',
      },
    );
    expect(valid).toBe(false);
    valid = ajv.validate(
      {
        type: 'object',
        properties: {
          'file-urn': { type: 'string', format: 'file-urn' },
        },
      },
      {
        'file-urn': 'urn:ads:platform:file-service:v1:/files/c7f1c6aa-3564-4541-a6f4-a0915dcb8906',
      },
    );
    expect(valid).toBe(true);
    valid = ajv.validate(
      {
        type: 'object',
        properties: {
          'file-urn': { type: 'string', format: 'file-urn' },
        },
      },
      {
        'file-urn':
          'urn:ads:platform:file-service:v1:/files/c7f1c6aa-3564-4541-a6f4-a0915dcb8906;urn:ads:platform:file-service:v1:/files/c7f1c6aa-3564-4541-a6f4-a0915dcb8906',
      },
    );
    expect(valid).toBe(true);
  });

  it('accepts custom pattern formats without unknown-format warnings', () => {
    const ajv = createDefaultAjv();
    const schema = {
      type: 'object',
      properties: {
        sinByFormat: { type: 'string', format: 'sin' },
        postalCode: { type: 'string', format: 'postalCode' },
        driverId: { type: 'string', format: 'driverId' },
        mvid: { type: 'string', format: 'mvid' },
      },
    };

    expect(ajv.validate(schema, {})).toBe(true);
    expect(ajv.validate(schema, { sinByFormat: '', postalCode: '', driverId: '', mvid: '' })).toBe(true);
    expect(
      ajv.validate(schema, {
        sinByFormat: '046 454 286',
        postalCode: 'T2P 1A1',
        driverId: '123456-789',
        mvid: '1234-56789',
      }),
    ).toBe(true);
    expect(ajv.validate(schema, { sinByFormat: '123 456 789' })).toBe(false);
    expect(ajv.validate(schema, { sinByFormat: '123456789' })).toBe(false);
    expect(ajv.validate(schema, { postalCode: 'T2P1A1' })).toBe(false);
    expect(ajv.validate(schema, { driverId: '123456789' })).toBe(false);
    expect(ajv.validate(schema, { mvid: '123456789' })).toBe(false);
  });

  it('runs Luhn validation as part of format sin', () => {
    const ajv = createDefaultAjv();
    const schema = { type: 'string', format: 'sin' };

    expect(ajv.validate(schema, '046 454 286')).toBe(true);
    expect(ajv.validate(schema, '123 111 111')).toBe(false);
    expect(ajv.errors?.[0]?.message).toBe('must match format "sin"');
  });

  it('uses the validSin keyword for Luhn when format sin is not set', () => {
    const ajv = createDefaultAjv();
    const schema = {
      type: 'string',
      pattern: '^\\d{3} \\d{3} \\d{3}$',
      validSin: true,
    };

    expect(ajv.validate(schema, '046 454 286')).toBe(true);
    expect(ajv.validate(schema, '123 111 111')).toBe(false);
    expect(ajv.errors?.[0]?.message).toBe(invalidSin);
  });

  it('skips the validSin keyword when it is false', () => {
    const ajv = createDefaultAjv();
    const schema = {
      type: 'string',
      pattern: '^\\d{3} \\d{3} \\d{3}$',
      validSin: false,
    };

    expect(ajv.validate(schema, '123 111 111')).toBe(true);
  });

  describe('can generate inital data ', () => {
    it('use default keyword', () => {
      const ajv = createDefaultAjv();
      const obj = {};
      //eslint-disable-next-line
      const data = ajv.validate(testDefaultSchema, obj);
      expect(JSON.stringify(obj) !== '{}').toBe(true);
    });
  });
});
