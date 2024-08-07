import '@testing-library/jest-dom';
import { createDefaultAjv } from './Ajv';

describe('Ajv tests', () => {
  it('should create a default ajv  instance', () => {
    const ajv = createDefaultAjv();

    expect(ajv).not.toBeNull();
  });
});
