import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createPdfService } from './pdf';
import { FormDefinitionEntity, FormEntity, FormStatus, FormSubmission, FormSubmissionEntity } from './form';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('pdf', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const validationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  const calendarService = {
    getScheduledIntake: jest.fn(),
  };

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((save) => Promise.resolve(save)),
    delete: jest.fn(),
    getByFormIdAndSubmissionId: jest.fn(),
  };

  const formSubmissionMock = {
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    getByFormIdAndSubmissionId: jest.fn(),
    dispositionSubmission: jest.fn(),
  };

  const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    description: null,
    anonymousApply: true,
    submissionRecords: false,
    submissionPdfTemplate: 'test template',
    supportTopic: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
    clerkRoles: ['test-clerk'],
    dataSchema: null,
    securityClassification: 'protected b',
    queueTaskToProcess: { queueNameSpace: 'test-queue-namespace', queueName: 'test-queue' },
  });

  const formInfo = {
    id: 'test-form',
    formDraftUrl: 'https://my-form/test-form',
    anonymousApplicant: false,
    created: new Date(),
    createdBy: { id: 'tester', name: 'tester' },
    status: FormStatus.Draft,
    locked: null,
    submitted: null,
    lastAccessed: new Date(),
    data: {},
    files: {},
    dryRun: false,
  };
  const entity = new FormEntity(repositoryMock, tenantId, definition, null, formInfo);

  const formSubmissionInfo: FormSubmission = {
    id: 'formSubmission-id',
    formDefinitionId: 'test-form-definition',
    formDefinitionRevision: 0,
    formId: 'test-form',
    formData: {},
    formFiles: {},
    created: new Date(),
    createdBy: { id: 'tester', name: 'tester' },
    updatedBy: { id: 'tester', name: 'tester' },
    updated: new Date(),
    submissionStatus: '',
    disposition: {
      id: 'id',
      status: 'rejected',
      reason: 'invalid data',
      date: new Date(),
    },
    hash: 'hashid',
    dryRun: false,
  };
  const submissionEntity = new FormSubmissionEntity(formSubmissionMock, tenantId, formSubmissionInfo);

  beforeEach(() => {
    axiosMock.post.mockClear();
    tokenProviderMock.getAccessToken.mockReset();
    directoryMock.getServiceUrl.mockReset();
  });

  it('can create pdf service', () => {
    const service = createPdfService(loggerMock as Logger, directoryMock, tokenProviderMock);
    expect(service).toBeTruthy();
  });

  describe('generateFormPdf', () => {
    const service = createPdfService(loggerMock as Logger, directoryMock, tokenProviderMock);
    it('can generate pdf', async () => {
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://pdf-service'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      axiosMock.post.mockResolvedValueOnce({ data: { id: '123' } });

      const result = await service.generateFormPdf(entity);
      expect(result).toBe('123');

      expect(axiosMock.post).toHaveBeenCalledWith(
        'http://pdf-service/pdf/v1/jobs',
        expect.objectContaining({
          operation: 'generate',
          templateId: definition.submissionPdfTemplate,
          recordId: 'urn:ads:platform:form-service:v1:/forms/test-form',
        }),
        expect.objectContaining({
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });

    it('can generate pdf with submission', async () => {
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://pdf-service'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      axiosMock.post.mockResolvedValueOnce({ data: { id: '123' } });

      const result = await service.generateFormPdf(entity, submissionEntity);
      expect(result).toBe('123');

      expect(axiosMock.post).toHaveBeenCalledWith(
        'http://pdf-service/pdf/v1/jobs',
        expect.objectContaining({
          operation: 'generate',
          templateId: definition.submissionPdfTemplate,
          recordId: 'urn:ads:platform:form-service:v1:/forms/test-form/submissions/formSubmission-id',
        }),
        expect.objectContaining({
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });

    it('can handle error in generate request', async () => {
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://pdf-service'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));

      const result = await service.generateFormPdf(entity);
      expect(result).toBeNull();
    });
  });
});
