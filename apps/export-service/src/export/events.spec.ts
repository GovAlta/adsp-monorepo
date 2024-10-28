import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { ExportQueuedDefinition, ExportCompletedDefinition, ExportFailedDefinition } from './events';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('export-queued is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ExportQueuedDefinition.payloadSchema);
  });

  it('export-completed is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ExportCompletedDefinition.payloadSchema);
  });

  it('export-failed is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ExportFailedDefinition.payloadSchema);
  });
});
