import '@testing-library/jest-dom';
import { createDefaultAjv } from './Ajv';

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
      }
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
      }
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
      }
    );
    expect(valid).toBe(true);
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
