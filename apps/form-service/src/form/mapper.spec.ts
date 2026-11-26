import { adspId } from '@abgov/adsp-service-sdk';
import { mapAdminFormDefinition, mapFormDefinition, mapFormSubmission, mapFormWithFormSubmission } from './mapper';
import { FormEntityWithJobId } from './router';
import { FormSubmissionEntity } from './model';
import { FormDefinition, FormSubmission } from './types';

describe('mapper', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  describe('mapFormDefinition', () => {
    const definition = {
      id: 'test',
      name: 'Test',
      registration: { enabled: true, accessGroup: 'test-access' },
    } as FormDefinition;

    it('does not return the access group', () => {
      expect(mapFormDefinition(definition, 1).registration).toEqual({ enabled: true });
    });

    it('can return the access group for administrators', () => {
      expect(mapAdminFormDefinition(definition, 1).registration).toEqual({
        enabled: true,
        accessGroup: 'test-access',
      });
    });

    it('can map a definition without an access group for administrators', () => {
      const { registration: _registration, ...withoutRegistration } = definition;

      expect(mapAdminFormDefinition(withoutRegistration as FormDefinition, 1).registration).toEqual({
        enabled: false,
      });
    });

    it('returns the security classification for administrators', () => {
      // Arrange
      const classified = { ...definition, securityClassification: 'protected b' } as FormDefinition;

      // Act
      const mapped = mapAdminFormDefinition(classified, 1);

      // Assert
      expect(mapped.securityClassification).toBe('protected b');
    });

    it('does not return the security classification to applicants', () => {
      // Arrange
      const classified = { ...definition, securityClassification: 'protected b' } as FormDefinition;

      // Act
      const mapped = mapFormDefinition(classified, 1);

      // Assert
      expect(mapped).not.toHaveProperty('securityClassification');
    });

    it('does not return the approver group and notification email', () => {
      const dataSchema = { type: 'object', properties: { licence: { type: 'string' } } };
      const uiSchema = { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/licence' }] };
      const withQuestions = {
        ...definition,
        registration: {
          enabled: true,
          accessGroup: 'test-access',
          approverGroup: 'test-approvers',
          notificationEmail: 'approvals@test.co',
          dataSchema,
          uiSchema,
        },
      } as unknown as FormDefinition;

      expect(mapFormDefinition(withQuestions, 1).registration).toEqual({ enabled: true, dataSchema, uiSchema });
      expect(mapAdminFormDefinition(withQuestions, 1).registration).toEqual({
        enabled: true,
        accessGroup: 'test-access',
        dataSchema,
        uiSchema,
      });
    });
  });

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
