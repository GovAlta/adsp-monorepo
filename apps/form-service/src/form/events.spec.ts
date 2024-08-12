import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  FormCreatedDefinition,
  FormDeletedDefinition,
  FormStatusLockedDefinition,
  FormStatusUnlockedDefinition,
  FormStatusArchivedDefinition,
  FormStatusSetToDraftDefinition,
  FormStatusSubmittedDefinition,
  SubmissionDispositionedDefinition,
  formSchema,
} from './events';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('form-created is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', FormCreatedDefinition.payloadSchema);
  });

  it('form-deleted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', FormDeletedDefinition.payloadSchema);
  });

  it('form-locked is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', FormStatusLockedDefinition.payloadSchema);
  });

  it('form-unlocked is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', FormStatusUnlockedDefinition.payloadSchema);
  });

  it('form-archived is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', FormStatusArchivedDefinition.payloadSchema);
  });

  it('form-to-draft is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', FormStatusSetToDraftDefinition.payloadSchema);
  });

  it('form-submitted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', FormStatusSubmittedDefinition.payloadSchema);
  });

  it('submission-dispositioned is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', SubmissionDispositionedDefinition.payloadSchema);
  });

  it('form definition schema is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', formSchema);
  });
});
