import { Logger } from 'winston';
import { AjvValueValidationService } from './ajv';

describe('ajv', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  describe('validate', () => {
    const validationService = new AjvValueValidationService(logger as unknown as Logger);
    validationService.setSchema('my-schema', {
      type: 'object',
      properties: {
        propertyA: { type: 'string' },
        propertyB: { type: 'number', metric: 'a' },
        propertyC: { type: 'number', metric: ['propertyA', 'value'] },
      },
    });

    it('can handle metric with constant name', () => {
      const value = {
        propertyA: '123',
        propertyB: 123,
      };
      validationService.validate('test', 'my-schema', value);

      expect(value['metrics'].a).toBe(123);
    });

    it('can handle metric with dynamic name', () => {
      const value = {
        propertyA: '123',
        propertyC: 123,
      };
      validationService.validate('test', 'my-schema', value);

      expect(value['metrics']['123:value']).toBe(123);
    });
  });
});
