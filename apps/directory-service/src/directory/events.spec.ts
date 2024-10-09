import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  EntryUpdatedDefinition,
  EntryDeletedDefinition,
  TaggedResourceDefinition,
  UntaggedResourceDefinition,
  ResourceResolutionFailedDefinition,
} from './events';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('entry-updated is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', EntryUpdatedDefinition.payloadSchema);
  });

  it('entry-deleted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', EntryDeletedDefinition.payloadSchema);
  });

  it('tagged-resource is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', TaggedResourceDefinition.payloadSchema);
  });

  it('untagged-resource is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', UntaggedResourceDefinition.payloadSchema);
  });

  it('resource-resolution-failed is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', ResourceResolutionFailedDefinition.payloadSchema);
  });
});
