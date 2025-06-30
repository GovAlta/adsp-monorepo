import { adspId } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import axios from 'axios';
import { Logger } from 'winston';
import { createCommentService } from './comment';
import { FormDefinitionEntity, FormEntity, FormStatus, SUPPORT_COMMENT_TOPIC_TYPE_ID } from './form';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('comment', () => {
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
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://comment-service'))),
    getResourceUrl: jest.fn(),
  };

  const validationService: ValidationService = {
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

  const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
    submissionRecords: false,
    submissionPdfTemplate: '',
    supportTopic: true,
    clerkRoles: [],
    dataSchema: null,
    dispositionStates: [{ id: 'rejectedStatus', name: 'rejected', description: 'err' }],
    queueTaskToProcess: { queueName: 'test', queueNameSpace: 'queue-namespace' },
  });

  const form = new FormEntity(repositoryMock, tenantId, definition, null, {
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
  });

  beforeEach(() => {
    directoryMock.getServiceUrl.mockClear();
    directoryMock.getResourceUrl.mockClear();
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.delete.mockReset();
    axiosMock.isAxiosError.mockReset();
  });

  it('can create service', async () => {
    const service = await createCommentService(
      loggerMock,
      directoryMock,
      tokenProviderMock,
      SUPPORT_COMMENT_TOPIC_TYPE_ID
    );
    expect(service).toBeTruthy();
  });

  describe('CommentService', () => {
    describe('createSupportTopic', () => {
      it('can create topic', async () => {
        const service = await createCommentService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          SUPPORT_COMMENT_TOPIC_TYPE_ID
        );

        axiosMock.post.mockResolvedValueOnce({ data: { urn: 'urn:ads:platform:comment-service:v1:/topics/2' } });

        const formUrn = 'urn:ads:platform:form-service:v1:/forms/test-form';
        await service.createSupportTopic(form, formUrn);
        expect(axiosMock.post).toHaveBeenCalledWith(
          'https://comment-service/comment/v1/topics',
          expect.objectContaining({ resourceId: formUrn }),
          expect.objectContaining({ params: expect.objectContaining({ tenantId: tenantId.toString() }) })
        );
      });

      it('can handle error', async () => {
        const service = await createCommentService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          SUPPORT_COMMENT_TOPIC_TYPE_ID
        );

        axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));

        const formUrn = 'urn:ads:platform:form-service:v1:/forms/test-form';
        await service.createSupportTopic(form, formUrn);
      });

      it('can handle axios error', async () => {
        const service = await createCommentService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          SUPPORT_COMMENT_TOPIC_TYPE_ID
        );

        const error = new Error('oh noes!');
        error['response'] = { data: { errorMessage: 'Something went wrong!' } };
        axiosMock.post.mockRejectedValueOnce(error);
        axiosMock.isAxiosError.mockReturnValueOnce(true);

        const formUrn = 'urn:ads:platform:form-service:v1:/forms/test-form';
        await service.createSupportTopic(form, formUrn);
      });

      it('can handle axios error without data', async () => {
        const service = await createCommentService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          SUPPORT_COMMENT_TOPIC_TYPE_ID
        );

        const error = new Error('oh noes!');
        error['response'] = {};
        axiosMock.post.mockRejectedValueOnce(error);
        axiosMock.isAxiosError.mockReturnValueOnce(true);

        const formUrn = 'urn:ads:platform:form-service:v1:/forms/test-form';
        await service.createSupportTopic(form, formUrn);
      });
    });
  });
});
