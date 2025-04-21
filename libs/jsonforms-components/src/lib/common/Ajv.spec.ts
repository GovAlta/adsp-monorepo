import '@testing-library/jest-dom';
import { createDefaultAjv } from './Ajv';

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
});
