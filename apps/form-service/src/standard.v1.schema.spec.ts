import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import * as standard from './standard.v1.schema.json';

describe('standard.schema', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('schema', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'schema', standard);
  });
});
