import { adspId, Channel, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, ValidationService } from '@core-services/core-common';
import axios from 'axios';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { accessForm, deleteForm, findForms, formOperation, getForm, getFormDefinition, updateFormData } from '.';
import { FormServiceRoles, FormStatus, FORM_SUBMITTED, QueueTaskToProcess, FormSubmission } from '..';
import { FormDefinitionEntity, FormEntity, FormSubmissionEntity } from '../model';

import {
  createForm,
  createFormRouter,
  deleteFormSubmission,
  findFormSubmissions,
  findSubmissions,
  getFormDefinitions,
  getFormSubmission,
  mapFormForSubmission,
  updateFormSubmissionDisposition,
  validateCriteria,
} from './form';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('form router', () => {
  const serviceId = adspId`urn:ads:platform:form-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const validationService: ValidationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  const calendarService = {
    getScheduledIntake: jest.fn(),
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
    queueTaskToProcess: { queueName: 'test', queueNameSpace: 'queue-namespace' } as QueueTaskToProcess,
  });
  const definitionWithPdfTemplate = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
    submissionRecords: false,
    submissionPdfTemplate: 'test-template',
    supportTopic: true,
    clerkRoles: [],
    dataSchema: null,
    dispositionStates: [{ id: 'rejectedStatus', name: 'rejected', description: 'err' }],
    queueTaskToProcess: { queueName: 'test', queueNameSpace: 'queue-namespace' } as QueueTaskToProcess,
  });

  const subscriberId = adspId`urn:ads:platform:notification-service:v1:/subscribers/test`;
  const subscriber = {
    id: 'test',
    urn: subscriberId,
    userId: null,
    addressAs: 'Tester',
    channels: [{ channel: Channel.email, address: 'test@test.co' }],
  };

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((save) => Promise.resolve(save)),
    delete: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const formSubmissionMock = {
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    dispositionSubmission: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const queueTaskServiceMock = {
    createTask: jest.fn(),
  };

  const formSubmissionEntityMock = {
    dispositionSubmission: jest.fn(),
  };

  const notificationServiceMock = {
    getSubscriber: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const fileServiceMock = {
    delete: jest.fn(),
  };

  const commentServiceMock = {
    createSupportTopic: jest.fn(),
  };

  const pdfServiceMock = {
    generateFormPdf: jest.fn(),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const calendarServiceMock = {
    getScheduledIntake: jest.fn(),
  };

  const formInfo = {
    id: 'test-form',
    formDraftUrl: 'https://my-form/test-form',
    anonymousApplicant: false,
    created: new Date(),
    createdBy: { id: 'tester', name: 'tester' },
    status: FormStatus.Draft,
    dispositionStates: [{ id: 'failed', name: 'failed', description: 'the form has indeterminate errors' }],
    locked: null,
    submitted: null,
    lastAccessed: new Date(),
    data: {},
    files: {},
    dryRun: false,
  };

  const submittedFormInfo = {
    id: 'test-form',
    formDraftUrl: 'https://my-form/test-form',
    anonymousApplicant: false,
    created: new Date(),
    createdBy: { id: 'tester', name: 'tester' },
    status: FormStatus.Submitted,
    dispositionStates: [{ id: 'failed', name: 'failed', description: 'the form has indeterminate errors' }],
    locked: null,
    submitted: new Date(),
    lastAccessed: new Date(),
    data: {},
    files: {},
    dryRun: false,
  };

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

  const entity = new FormEntity(repositoryMock, tenantId, definition, subscriber, formInfo);
  const entityWithPdfTemplate = new FormEntity(
    repositoryMock,
    tenantId,
    definitionWithPdfTemplate,
    subscriber,
    formInfo
  );

  const formSubmissionEntity = new FormSubmissionEntity(
    formSubmissionMock,
    tenantId,
    formSubmissionInfo,
    definition,
    entity
  );

  beforeEach(() => {
    axiosMock.get.mockClear();

    repositoryMock.save.mockClear();
    repositoryMock.get.mockReset();
    repositoryMock.delete.mockReset();
    repositoryMock.find.mockReset();

    formSubmissionMock.get.mockReset();
    formSubmissionMock.save.mockClear();
    formSubmissionMock.delete.mockReset();
    formSubmissionMock.find.mockClear();
    formSubmissionMock.dispositionSubmission.mockReset();
    formSubmissionEntityMock.dispositionSubmission.mockReset();

    notificationServiceMock.subscribe.mockReset();
    notificationServiceMock.sendCode.mockReset();
    notificationServiceMock.verifyCode.mockReset();
    notificationServiceMock.unsubscribe.mockReset();
    eventServiceMock.send.mockReset();
    commentServiceMock.createSupportTopic.mockClear();
    pdfServiceMock.generateFormPdf.mockClear();
    tenantServiceMock.getTenant.mockClear();

    directoryMock.getServiceUrl.mockClear();
  });

  it('can create router', () => {
    const router = createFormRouter({
      apiId,
      logger,
      repository: repositoryMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      notificationService: notificationServiceMock,
      queueTaskService: queueTaskServiceMock,
      fileService: fileServiceMock,
      commentService: commentServiceMock,
      submissionRepository: repositoryMock,
      pdfService: pdfServiceMock,
      tenantService: tenantServiceMock,
      calendarService: calendarServiceMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getFormDefinitions', () => {
    it('can create handler', () => {
      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non admin', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can get definitions', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://configuration-service/configuration/v2'));
      axiosMock.get.mockResolvedValueOnce({ data: { page: {}, results: [{ latest: { configuration: definition } }] } });

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.any(Object),
          results: expect.arrayContaining([expect.objectContaining({ id: definition.id })]),
        })
      );
    });
  });

  describe('getFormDefinition', () => {
    it('can create handler', () => {
      const handler = getFormDefinition(tenantServiceMock, calendarServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can get definition from namespace', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        params: { definitionId: 'test' },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      const handler = getFormDefinition(tenantServiceMock, calendarServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalledWith('test', tenantId);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'test', name: 'test-form-definition' }));
    });

    it('can call next with unauthorized', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        params: { definitionId: 'test' },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      const handler = getFormDefinition(tenantServiceMock, calendarServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with not found', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        params: { definitionId: 'test-2' },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([]);
      expect(res.send).not.toHaveBeenCalled();
      const handler = getFormDefinition(tenantServiceMock, calendarServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('cannot determine missing tenant info', async () => {
      const req = {
        params: { definitionId: 'test' },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
        tenant: null,
        query: { tenantId: tenantId.toString() },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getFormDefinition(tenantServiceMock, calendarServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can get definition for anonymous user', async () => {
      const req = {
        params: { definitionId: 'test' },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
        query: { tenantId: tenantId.toString() },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
        id: 'test',
        name: 'test-form-definition',
        description: null,
        formDraftUrlTemplate: 'https://my-form/{{ id }}',
        anonymousApply: true,
        applicantRoles: ['test-applicant'],
        assessorRoles: ['test-assessor'],
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: true,
        clerkRoles: [],
        dataSchema: null,
        dispositionStates: [{ id: 'rejectedStatus', name: 'rejected', description: 'err' }],
        queueTaskToProcess: { queueName: 'test', queueNameSpace: 'queue-namespace' } as QueueTaskToProcess,
      });

      tenantServiceMock.getTenant.mockResolvedValueOnce({ id: tenantId });
      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      const handler = getFormDefinition(tenantServiceMock, calendarServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalledWith('test', tenantId);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'test', name: 'test-form-definition' }));
    });

    it('can call next with unauthorized user for definition not allowing anonymous apply', async () => {
      const req = {
        params: { definitionId: 'test' },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
        query: { tenantId: tenantId.toString() },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      tenantServiceMock.getTenant.mockResolvedValueOnce({ id: tenantId });
      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      const handler = getFormDefinition(tenantServiceMock, calendarServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalledWith('test', tenantId);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('findForms', () => {
    it('can create handler', () => {
      const handler = findForms(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can find forms', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};

      repositoryMock.find.mockResolvedValueOnce({ results: [entity], page });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can find orphaned forms', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};

      repositoryMock.find.mockResolvedValueOnce({
        results: [new FormEntity(repositoryMock, tenantId, null, subscriber, formInfo)],
        page,
      });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining({ id: formInfo.id, definition: null })]),
        })
      );
    });

    it('can find forms has query params', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ statusEquals: 'Draft' }),
        },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};

      repositoryMock.find.mockResolvedValueOnce({ results: [entity], page });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can call next with invalid operation for bad criteria', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        query: { criteria: "'" },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};

      repositoryMock.find.mockResolvedValueOnce({ results: [entity], page });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('cannot find forms with error', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};

      repositoryMock.find.mockResolvedValueOnce(null);

      const handler = findForms(apiId, repositoryMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalledWith(expect.objectContaining({ page }));
      expect(next).toBeCalledWith(expect.any(Error));
    });

    it('can limit non-admin user to own forms', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      repositoryMock.find.mockResolvedValueOnce({ results: [entity], page });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
      expect(repositoryMock.find).toHaveBeenCalledWith(
        expect.any(Number),
        undefined,
        expect.objectContaining({ createdByIdEquals: user.id })
      );
    });

    it('can prevent non-admin user from finding forms with data', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        query: { includeData: 'true' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      repositoryMock.find.mockResolvedValueOnce({ results: [entity], page });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('createForm', () => {
    it('can create handler', () => {
      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      expect(handler).toBeTruthy();
    });

    it('can create forms', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        query: {},
        body: {
          definitionId: 'test',
          applicant: { addressAs: 'applicant', channels: [{ channel: Channel.email, address: 'applicant@apply.co' }] },
        },
        getConfiguration: jest.fn(),
        getServiceConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      notificationServiceMock.subscribe.mockResolvedValueOnce(subscriber);

      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Draft }));
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(commentServiceMock.createSupportTopic).toHaveBeenCalledTimes(1);
    });

    it('can call next with unauthorized user', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        query: {},
        body: {
          definitionId: 'test',
          applicant: { addressAs: 'applicant', channels: [{ channel: Channel.email, address: 'applicant@apply.co' }] },
        },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);

      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with not found', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        query: {},
        body: {
          definitionId: 'test-2',
          applicant: { addressAs: 'applicant', channels: [{ channel: Channel.email, address: 'applicant@apply.co' }] },
        },
        getServiceConfiguration: jest.fn(),
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([]);
      req.getConfiguration.mockResolvedValueOnce([{}]);

      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can create form and update data', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        query: {},
        body: {
          definitionId: 'test',
          applicant: { addressAs: 'applicant', channels: [{ channel: Channel.email, address: 'applicant@apply.co' }] },
          data: { value: 'value-a' },
        },
        getConfiguration: jest.fn(),
        getServiceConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      notificationServiceMock.subscribe.mockResolvedValueOnce(subscriber);

      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Draft }));
      expect(repositoryMock.save).toHaveBeenCalledTimes(2);
      expect(commentServiceMock.createSupportTopic).toHaveBeenCalledTimes(1);
    });

    it('can create form and update data and files', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        query: {},
        body: {
          definitionId: 'test',
          applicant: { addressAs: 'applicant', channels: [{ channel: Channel.email, address: 'applicant@apply.co' }] },
          data: { value: 'value-a' },
          files: {
            test: 'urn:ads:platform:file-service:v1:/files/test',
          },
        },
        getConfiguration: jest.fn(),
        getServiceConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      notificationServiceMock.subscribe.mockResolvedValueOnce(subscriber);

      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Draft }));
      expect(repositoryMock.save).toHaveBeenCalledTimes(2);
      expect(commentServiceMock.createSupportTopic).toHaveBeenCalledTimes(1);
    });

    it('can create form and submit', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        query: {},
        body: {
          definitionId: 'test',
          applicant: { addressAs: 'applicant', channels: [{ channel: Channel.email, address: 'applicant@apply.co' }] },
          submit: true,
        },
        getConfiguration: jest.fn(),
        getServiceConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      notificationServiceMock.subscribe.mockResolvedValueOnce(subscriber);

      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Submitted }));
      expect(repositoryMock.save).toHaveBeenCalledTimes(2);
      expect(commentServiceMock.createSupportTopic).toHaveBeenCalledTimes(1);
    });

    it('can create form and submit with submission', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        query: {},
        body: {
          definitionId: 'test',
          applicant: { addressAs: 'applicant', channels: [{ channel: Channel.email, address: 'applicant@apply.co' }] },
          submit: true,
        },
        getConfiguration: jest.fn(),
        getServiceConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([
        new FormDefinitionEntity(validationService, calendarService, tenantId, {
          ...definition,
          submissionRecords: true,
        }),
      ]);
      notificationServiceMock.subscribe.mockResolvedValueOnce(subscriber);
      formSubmissionMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = createForm(
        apiId,
        logger,
        repositoryMock,
        formSubmissionMock,
        eventServiceMock,
        commentServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ status: FormStatus.Submitted, submission: expect.any(Object) })
      );
      expect(repositoryMock.save).toHaveBeenCalledTimes(2);
      expect(commentServiceMock.createSupportTopic).toHaveBeenCalledTimes(1);
    });
  });

  describe('getForm', () => {
    it('can create handler', () => {
      const handler = getForm(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get form', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        tenant: { id: tenantId },
        params: { formId: 'test-form' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(entity);
      const handler = getForm(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req['form']).toBe(entity);
      expect(next).toBeCalledWith();
    });

    it('can get form with submission data', async () => {
      const formEntity = new FormEntity(repositoryMock, tenantId, definition, subscriber, submittedFormInfo);

      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        tenant: { id: tenantId },
        params: { formId: 'test-form' },
        query: {},
        form: formEntity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const page = {};
      repositoryMock.get.mockResolvedValueOnce(formEntity);
      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });
      const handler = mapFormForSubmission(apiId, formSubmissionMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalled();
    });

    it('can get form with no submission', async () => {
      const formEntity = new FormEntity(repositoryMock, tenantId, definition, subscriber, formInfo);

      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        tenant: { id: tenantId },
        params: { formId: 'test-form' },
        query: {},
        form: formEntity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      repositoryMock.get.mockResolvedValueOnce(formEntity);

      const handler = mapFormForSubmission(apiId, formSubmissionMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalled();
    });
    it('can call next with not found', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        tenant: { id: tenantId },
        params: { formId: 'test-form' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(null);
      const handler = getForm(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toBeCalledWith(expect.any(NotFoundError));
    });

    it('can call next with unauthorized', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        tenant: { id: tenantId },
        params: { formId: 'test-form' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(entity);
      const handler = getForm(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('accessForm', () => {
    it('can create handler', () => {
      const handler = accessForm(logger, notificationServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can access form by user', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        query: {},
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = accessForm(logger, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalled();
    });

    it('can access form by code', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.IntakeApp],
      };
      const req = {
        user,
        query: { code: '123' },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      notificationServiceMock.verifyCode.mockResolvedValueOnce(true);

      const handler = accessForm(logger, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(notificationServiceMock.verifyCode).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('can call next for unauthorized user', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        query: {},
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = accessForm(logger, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('updateFormData', () => {
    it('can update form data', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        body: {
          data: {},
          files: {
            test: 'urn:ads:platform:file-service:v1:/files/test',
          },
        },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateFormData(logger);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalled();
    });

    it('can call next with unauthorized user', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        body: { data: {}, files: {} },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateFormData(logger);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteForm', () => {
    it('can create handler', () => {
      const handler = deleteForm(apiId, logger, eventServiceMock, fileServiceMock, notificationServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete form data', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(true);

      const handler = deleteForm(apiId, logger, eventServiceMock, fileServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.delete).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(notificationServiceMock.unsubscribe).toHaveBeenCalledWith(tenantId, subscriber.urn, entity.id);
    });

    it('can call next with unauthorized user', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = deleteForm(apiId, logger, eventServiceMock, fileServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('formOperation', () => {
    it('can create handler', () => {
      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      expect(handler).toBeTruthy();
    });

    it('can send code', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.IntakeApp],
      };
      const req = {
        user,
        body: { operation: 'send-code' },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      notificationServiceMock.sendCode.mockResolvedValueOnce(null);

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(notificationServiceMock.sendCode).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('can submit form with pdf template', async () => {
      axiosMock.post.mockResolvedValueOnce({ response: 'success' });
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        body: { operation: 'submit' },
        params: { formId: 'test-form' },
        form: entityWithPdfTemplate,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      notificationServiceMock.sendCode.mockResolvedValueOnce(null);

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Submitted }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: FORM_SUBMITTED }));
      expect(pdfServiceMock.generateFormPdf).toHaveBeenCalledWith(entityWithPdfTemplate, null);
    });

    it('can submit form', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        body: { operation: 'submit' },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      notificationServiceMock.sendCode.mockResolvedValueOnce(null);

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Submitted }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: FORM_SUBMITTED }));
    });

    it('can submit form and create submission', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        body: { operation: 'submit' },
        params: { formId: 'test-form' },
        form: new FormEntity(
          repositoryMock,
          tenantId,
          new FormDefinitionEntity(validationService, calendarService, tenantId, {
            ...definition,
            submissionRecords: true,
          }),
          subscriber,
          formInfo
        ),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      notificationServiceMock.sendCode.mockResolvedValueOnce(null);

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ status: FormStatus.Submitted, submission: expect.any(Object) })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: FORM_SUBMITTED,
          payload: expect.objectContaining({ submission: expect.any(Object) }),
        })
      );
    });

    it('can set form to draft', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        body: { operation: 'to-draft' },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Draft }));
    });

    it('can archive form', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        body: { operation: 'archive' },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Archived }));
      expect(notificationServiceMock.unsubscribe).toHaveBeenCalledWith(tenantId, subscriber.urn, entity.id);
    });

    it('can unlock form', async () => {
      const formInfo = {
        id: 'test-form',
        formDraftUrl: 'https://my-form/test-form',
        anonymousApplicant: true,
        created: new Date(),
        createdBy: { id: 'tester', name: 'tester' },
        status: FormStatus.Locked,
        locked: null,
        submitted: null,
        lastAccessed: new Date(),
        data: {},
        files: {},
        dryRun: false,
      };
      const locked = new FormEntity(repositoryMock, tenantId, definition, subscriber, formInfo);

      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        body: { operation: 'unlock' },
        params: { formId: 'test-form' },
        form: locked,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).toHaveBeenCalledWith(locked);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Draft }));
    });

    it('can call next with invalid operation', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      };
      const req = {
        user,
        body: { operation: 'unknown' },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = formOperation(
        apiId,
        logger,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock,
        pdfServiceMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('updateFormSubmissionDisposition', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: [FormServiceRoles.Admin],
    };
    it('can create handler updateFormSubmissionDisposition', () => {
      const handler = updateFormSubmissionDisposition(apiId, logger, eventServiceMock, formSubmissionMock);
      expect(handler).toBeTruthy();
    });

    it('can update form submission disposition', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'rejected', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      formSubmissionMock.get.mockResolvedValueOnce(formSubmissionEntity);
      formSubmissionMock.save.mockResolvedValueOnce(formSubmissionEntity);

      const handler = updateFormSubmissionDisposition(apiId, logger, eventServiceMock, formSubmissionMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(formSubmissionMock.get).toBeCalled();
      expect(formSubmissionMock.save).toBeCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'formSubmission-id' }));
    });

    it('form submission not found to update disposition', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'invalid status', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      formSubmissionMock.get.mockResolvedValueOnce(null);
      formSubmissionMock.save.mockResolvedValueOnce(formSubmissionEntity);

      const handler = updateFormSubmissionDisposition(apiId, logger, eventServiceMock, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getFormSubmission', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: [FormServiceRoles.Admin],
    };

    it('can create handler getFormSubmission', () => {
      const handler = getFormSubmission(apiId, formSubmissionMock);
      expect(handler).toBeTruthy();
    });

    it('can get form submission by id', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'invalid status', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      formSubmissionMock.get.mockResolvedValueOnce(formSubmissionEntity);

      const handler = getFormSubmission(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalled();
    });

    it('cannot get form submission by id', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'invalid status', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      formSubmissionMock.get.mockResolvedValueOnce(null);

      const handler = getFormSubmission(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('cannot get form submission by id with permission', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'invalid status', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      formSubmissionMock.get.mockResolvedValueOnce(formSubmissionEntity);

      const handler = getFormSubmission(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteFormSubmission', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: [FormServiceRoles.Admin],
    };

    it('can create handler getFormSubmission', () => {
      const handler = deleteFormSubmission(apiId, eventServiceMock, formSubmissionMock);
      expect(handler).toBeTruthy();
    });

    it('can delete form submission by id', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'invalid status', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      formSubmissionMock.get.mockResolvedValueOnce(formSubmissionEntity);
      formSubmissionMock.delete.mockResolvedValueOnce(true);

      const handler = deleteFormSubmission(apiId, eventServiceMock, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
    });

    it('can delete form submission by id and return false', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'invalid status', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      formSubmissionMock.get.mockResolvedValueOnce(null);

      const handler = deleteFormSubmission(apiId, eventServiceMock, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: false }));
    });

    it('can call next with unauthorized', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        body: { dispositionStatus: 'invalid status', dispositionReason: 'invalid data' },
        params: { formId: 'test-form', submissionId: 'submissionId' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = deleteFormSubmission(apiId, eventServiceMock, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('findSubmissions', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: [FormServiceRoles.Admin],
    };
    it('can create handler for find submissions', () => {
      const handler = findSubmissions(apiId, formSubmissionMock);
      expect(handler).toBeTruthy();
    });

    it('can find form submissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {},
        getServiceConfiguration: jest.fn(),
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findSubmissions(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(formSubmissionMock.find).toBeCalledWith(
        100,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can find form submissions of definition', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '10',
          after: 'abc-123',
          criteria: JSON.stringify({ createDateBefore: '2024-01-12', definitionIdEquals: definition.id }),
        },
        getServiceConfiguration: jest.fn(),
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);

      const formSubmissionEntity = new FormSubmissionEntity(
        formSubmissionMock,
        tenantId,
        formSubmissionInfo,
        definition,
        entity
      );
      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findSubmissions(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalledWith(definition.id, tenantId);
      expect(formSubmissionMock.find).toBeCalledWith(
        10,
        'abc-123',
        expect.objectContaining({ tenantIdEquals: tenantId, definitionIdEquals: definition.id })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can find form submissions of definition as assessor', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-assessor'],
      };
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          criteria: JSON.stringify({ createDateBefore: '2024-01-12', definitionIdEquals: definition.id }),
        },
        getServiceConfiguration: jest.fn(),
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);

      const formSubmissionEntity = new FormSubmissionEntity(
        formSubmissionMock,
        tenantId,
        formSubmissionInfo,
        definition,
        entity
      );
      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findSubmissions(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalledWith(definition.id, tenantId);
      expect(formSubmissionMock.find).toBeCalledWith(
        100,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId, definitionIdEquals: definition.id })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can find form submissions not authorized', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['abc'],
      };
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {},
        getServiceConfiguration: jest.fn(),
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findSubmissions(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(formSubmissionMock.find).not.toBeCalled();
      expect(res.send).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('can find form submissions of definition not authorized', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['abc'],
      };
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          criteria: JSON.stringify({ createDateBefore: '2024-01-12', definitionIdEquals: definition.id }),
        },
        getServiceConfiguration: jest.fn(),
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findSubmissions(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(formSubmissionMock.find).not.toBeCalled();
      expect(res.send).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('findFormSubmissions', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: [FormServiceRoles.Admin],
    };
    it('can create handler for find submissions', () => {
      const handler = findFormSubmissions(apiId, formSubmissionMock, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can find form submissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {},
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(entity);

      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findFormSubmissions(apiId, formSubmissionMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(formSubmissionMock.find).toBeCalledWith(
        100,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId, formIdEquals: 'test-form' })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can find form submissions no definition', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '10',
          after: 'abc-123',
          criteria: JSON.stringify({ createDateBefore: '2024-01-12' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      const formSubmissionEntity = new FormSubmissionEntity(
        formSubmissionMock,
        tenantId,
        formSubmissionInfo,
        definition,
        entity
      );

      repositoryMock.get.mockResolvedValueOnce(null);

      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findFormSubmissions(apiId, formSubmissionMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(formSubmissionMock.find).toBeCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can find form submissions has query params', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '10',
          after: 'abc-123',
          criteria: JSON.stringify({ createDateBefore: '2024-01-12' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(entity);

      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findFormSubmissions(apiId, formSubmissionMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(formSubmissionMock.find).toBeCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can find form submissions not authorized', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['abc'],
      };
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {},
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };

      const page = {};

      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(entity);

      formSubmissionMock.find.mockResolvedValueOnce({ results: [formSubmissionEntity], page });

      const handler = findFormSubmissions(apiId, formSubmissionMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(formSubmissionMock.find).not.toBeCalled();
      expect(res.send).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateCriteria', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: ['test-applicant'],
    };

    it('validate criteria createDateBefore for findFormSubmissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ createDateBefore: '2024-01-12' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };
      const configuration = { test: definition };

      req.getConfiguration.mockResolvedValueOnce([configuration]);
      repositoryMock.get.mockResolvedValueOnce(entity);

      validateCriteria(req.query.criteria);
    });

    it('validate criteria createDateAfter  for findFormSubmissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ createDateAfter: '2024-01-12' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };
      const configuration = { test: definition };

      req.getConfiguration.mockResolvedValueOnce([configuration]);
      repositoryMock.get.mockResolvedValueOnce(entity);

      validateCriteria(req.query.criteria);
    });

    it('validate criteria dispositionDateBefore  for findFormSubmissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ dispositionDateBefore: '2024-01-12' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };
      const configuration = { test: definition };

      req.getConfiguration.mockResolvedValueOnce([configuration]);
      repositoryMock.get.mockResolvedValueOnce(entity);

      validateCriteria(req.query.criteria);
    });

    it('validate criteria dispositionDateAfter for findFormSubmissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ dispositionDateAfter: '2024-01-12' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };
      const configuration = { test: definition };

      req.getConfiguration.mockResolvedValueOnce([configuration]);
      repositoryMock.get.mockResolvedValueOnce(entity);
    });

    test('validate criteria createDateBefore invalid for findFormSubmissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ createDateBefore: '2024-01-32' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };
      expect(() => validateCriteria(req.query.criteria)).toThrow(InvalidOperationError);
    });

    test('validate criteria createDateAfter invalid for findFormSubmissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ createDateAfter: '2024-01-32' }),
        },
        params: { formId: 'test-form' },
      };

      expect(() => validateCriteria(req.query.criteria)).toThrow(InvalidOperationError);
    });

    test('validate criteria dispositionDateAfter  invalid for findFormSubmissions', async () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ dispositionDateAfter: '2024-01-32' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };
      expect(() => validateCriteria(req.query.criteria)).toThrow(InvalidOperationError);
    });

    test('validate criteria dispositionDateBefore invalid for findFormSubmissions', () => {
      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({ dispositionDateBefore: '2024-01-32' }),
        },
        getConfiguration: jest.fn(),
        params: { formId: 'test-form' },
      };
      expect(() => validateCriteria(req.query.criteria)).toThrow(InvalidOperationError);
    });
  });
});
