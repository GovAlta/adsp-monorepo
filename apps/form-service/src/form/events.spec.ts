import { AjvValidationService } from '@core-services/core-common';
import { adspId } from '@abgov/adsp-service-sdk';
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
  SubmissionDeletedDefinition,
  SharePointPushFailedDefinition,
  sharePointPushFailed,
  SHAREPOINT_PUSH_FAILED,
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

  it('submission-deleted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', SubmissionDeletedDefinition.payloadSchema);
  });

  it('form definition schema is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', formSchema);
  });

  it('sharepoint-push-failed is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', SharePointPushFailedDefinition.payloadSchema);
  });

  it('sharepoint-push-failed carries identifiers and the error code only', () => {
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const timestamp = new Date('2026-11-19T12:00:00Z');

    const event = sharePointPushFailed(
      adspId`urn:ads:platform:form-service:v1`,
      { tenantId, formId: 'form-1', submissionId: 'submission-1', attempts: 5 },
      'submission-pdf',
      'hr-intake',
      'entra:AADSTS7000222',
      timestamp,
    );

    expect(event).toEqual({
      name: SHAREPOINT_PUSH_FAILED,
      timestamp,
      tenantId,
      correlationId: 'urn:ads:platform:form-service:v1:/forms/form-1',
      context: { formId: 'form-1', destinationId: 'hr-intake' },
      payload: {
        formId: 'form-1',
        submissionId: 'submission-1',
        destinationId: 'hr-intake',
        part: 'submission-pdf',
        errorCode: 'entra:AADSTS7000222',
        attempts: 5,
      },
    });
  });
});
