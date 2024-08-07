import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { ValueWrittenDefinition } from './events';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('value-written is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ValueWrittenDefinition.payloadSchema);
  });
});
