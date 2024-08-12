import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  ActiveRevisionSetDefinition,
  ConfigurationDeletedDefinition,
  ConfigurationUpdatedDefinition,
  RevisionCreatedDefinition,
} from './events';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('configuration-updated is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ConfigurationUpdatedDefinition.payloadSchema);
  });

  it('configuration-deleted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ConfigurationDeletedDefinition.payloadSchema);
  });

  it('revision-created is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', RevisionCreatedDefinition.payloadSchema);
  });

  it('active-revision-set is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ActiveRevisionSetDefinition.payloadSchema);
  });
});
