import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { configurationSchema } from './configuration';

describe('configuration', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('configuration', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'configuration', configurationSchema);
  });

  it('can allow namespace configuration', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('configuration', configurationSchema);
    service.validate('test', 'configuration', {
      namespaceConfiguration: { configurationSchema: { type: 'object' } },
      'namespace:nameConfiguration': { configurationSchema: { type: 'object' } },
    });
  });
});
