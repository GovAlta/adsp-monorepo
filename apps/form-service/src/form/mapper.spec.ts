import { adspId } from '@abgov/adsp-service-sdk';
import { mapFormSubmission, mapFormWithFormSubmission } from './mapper';
import { FormEntityWithJobId } from './router';
import { FormSubmissionEntity } from './model';
import { FormSubmission } from './types';

describe('mapper', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const submissionInfo: FormSubmission = {
    id: 'submission-1',
    formDefinitionId: 'test-form-definition',
    formDefinitionRevision: 0,
    formId: 'form-1',
    formData: {},
    formFiles: {},
    created: new Date(),
    createdBy: { id: 'tester', name: 'tester' },
    updatedBy: { id: 'tester', name: 'tester' },
    updated: new Date(),
    submissionStatus: '',
    disposition: null,
    hash: 'hashid',
    dryRun: false,
  };

  describe('mapFormSubmission', () => {
    it('can map submission notes', () => {
      const created = new Date();
      const entity = new FormSubmissionEntity(repositoryMock, tenantId, {
        ...submissionInfo,
        notes: [{ id: 'note-1', content: 'Called the applicant.', created, createdBy: { id: 'r1', name: 'Reviewer' } }],
      });

      const result = mapFormSubmission(apiId, entity);

      expect(result.notes).toEqual([
        { id: 'note-1', content: 'Called the applicant.', created, createdBy: { id: 'r1', name: 'Reviewer' } },
      ]);
    });

    it('can map submission without notes', () => {
      const entity = new FormSubmissionEntity(repositoryMock, tenantId, submissionInfo);

      const result = mapFormSubmission(apiId, entity);

      expect(result.notes).toEqual([]);
      expect(result.disposition).toBeNull();
      expect(result.urn).toBe(`${apiId}:/submissions/submission-1`);
    });

    it('can map submission disposition', () => {
      const date = new Date();
      const entity = new FormSubmissionEntity(repositoryMock, tenantId, {
        ...submissionInfo,
        disposition: { id: 'disposition-1', status: 'rejected', reason: 'invalid data', date },
      });

      const result = mapFormSubmission(apiId, entity);

      expect(result.disposition).toEqual({ id: 'disposition-1', status: 'rejected', reason: 'invalid data', date });
    });
  });
  describe('mapFormWithFormSubmission', () => {
    const form = {
      id: 'form-1',
      definition: { id: 'test-form-definition', name: 'Test form', description: '', submissionRecords: true },
      status: 'submitted',
      created: new Date(),
      submitted: new Date(),
    } as unknown as FormEntityWithJobId;

    it('can map submission disposition status and date for the applicant', () => {
      const date = new Date();
      const entity = new FormSubmissionEntity(repositoryMock, tenantId, {
        ...submissionInfo,
        disposition: { id: 'disposition-1', status: 'Approved', reason: 'internal assessor note', date },
      });

      const result = mapFormWithFormSubmission(apiId, form, entity);

      expect(result.submission).toEqual({
        id: 'submission-1',
        urn: entity.formSubmissionUrn,
        disposition: { status: 'Approved', date },
      });
    });

    it('can map submission without disposition', () => {
      const entity = new FormSubmissionEntity(repositoryMock, tenantId, submissionInfo);

      const result = mapFormWithFormSubmission(apiId, form, entity);

      expect(result.submission.disposition).toBeNull();
    });
  });
});
