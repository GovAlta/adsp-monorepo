import { adspId, Channel, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, ValidationService } from '@core-services/core-common';
import { Request, Response } from 'express';
import { accessForm, deleteForm, findForms, formOperation, getForm, getFormDefinition, updateFormData } from '.';
import { FormServiceRoles, FormStatus, FORM_SUBMITTED, QueueTaskToProcess, FormSubmission } from '..';
import { FormDefinitionEntity, FormEntity, FormSubmissionEntity } from '../model';

import {
  createForm,
  createFormRouter,
  findFormSubmissions,
  getFormDefinitions,
  getFormSubmission,
  updateFormSubmissionDisposition,
  validateCriteria,
} from './form';

describe('form router', () => {
  const serviceId = adspId`urn:ads:platform:form-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const validationService: ValidationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };
  const definition = new FormDefinitionEntity(validationService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
    submissionRecords: false,
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
  };

  const formSubmissionInfo: FormSubmission = {
    id: 'formSubmission-id',
    formDefinitionId: 'test-form-definition',
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
  };

  const entity = new FormEntity(repositoryMock, tenantId, definition, subscriber, formInfo);

  const formSubmissionEntity = new FormSubmissionEntity(formSubmissionMock, tenantId, formSubmissionInfo, entity);

  beforeEach(() => {
    repositoryMock.save.mockClear();
    repositoryMock.get.mockReset();
    repositoryMock.delete.mockReset();
    repositoryMock.find.mockReset();

    formSubmissionMock.get.mockReset();
    formSubmissionMock.save.mockClear();
    formSubmissionMock.delete.mockReset();
    formSubmissionMock.dispositionSubmission.mockReset();
    formSubmissionMock.getByFormIdAndSubmissionId.mockReset();
    formSubmissionEntityMock.dispositionSubmission.mockReset();

    notificationServiceMock.subscribe.mockReset();
    notificationServiceMock.sendCode.mockReset();
    notificationServiceMock.verifyCode.mockReset();
    eventServiceMock.send.mockReset();
    commentServiceMock.createSupportTopic.mockClear();
  });

  it('can create router', () => {
    const router = createFormRouter({
      apiId,
      repository: repositoryMock,
      eventService: eventServiceMock,
      notificationService: notificationServiceMock,
      queueTaskService: queueTaskServiceMock,
      fileService: fileServiceMock,
      commentService: commentServiceMock,
      submissionRepository: repositoryMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getFormDefinitions', () => {
    it('can get definitions', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      await getFormDefinitions(req as unknown as Request, res as unknown as Response, next);

      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'test', name: 'test-form-definition' })])
      );
    });

    it('cannot get definitions with error', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      };
      const req = {
        user,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(null);
      await getFormDefinitions(req as unknown as Request, res as unknown as Response, next);

      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.send).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
    it('can filter out definitions not accessible to user', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      await getFormDefinitions(req as unknown as Request, res as unknown as Response, next);

      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([]));
    });
  });

  describe('getFormDefinition', () => {
    it('can get definition', async () => {
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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getServiceConfiguration.mockResolvedValueOnce([]);
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      await getFormDefinition(req as unknown as Request, res as unknown as Response, next);

      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'test', name: 'test-form-definition' }));
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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      await getFormDefinition(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalledWith('test');
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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([definition]);
      await getFormDefinition(req as unknown as Request, res as unknown as Response, next);

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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getServiceConfiguration.mockResolvedValueOnce([]);
      req.getConfiguration.mockResolvedValueOnce([{}]);
      await getFormDefinition(req as unknown as Request, res as unknown as Response, next);

      expect(req.getServiceConfiguration).toHaveBeenCalled();
      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
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
  });

  describe('createForm', () => {
    it('can create handler', () => {
      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock, commentServiceMock);
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

      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock, commentServiceMock);
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

      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock, commentServiceMock);
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

      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock, commentServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
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
      const handler = accessForm(notificationServiceMock);
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

      const handler = accessForm(notificationServiceMock);
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

      const handler = accessForm(notificationServiceMock);
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

      const handler = accessForm(notificationServiceMock);
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

      await updateFormData(req as unknown as Request, res as unknown as Response, next);
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

      await updateFormData(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteForm', () => {
    it('can create handler', () => {
      const handler = deleteForm(apiId, eventServiceMock, fileServiceMock, notificationServiceMock);
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

      const handler = deleteForm(apiId, eventServiceMock, fileServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.delete).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
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

      const handler = deleteForm(apiId, eventServiceMock, fileServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('formOperation', () => {
    it('can create handler', () => {
      const handler = formOperation(
        apiId,
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock
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
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(notificationServiceMock.sendCode).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
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
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Submitted }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: FORM_SUBMITTED }));
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
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock
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
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Archived }));
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
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock
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
        eventServiceMock,
        notificationServiceMock,
        queueTaskServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('form submission disposition', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: [FormServiceRoles.Admin],
    };
    it('can create handler updateFormSubmissionDisposition', () => {
      const handler = updateFormSubmissionDisposition(apiId, eventServiceMock, repositoryMock, formSubmissionMock);
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

      formSubmissionMock.getByFormIdAndSubmissionId.mockResolvedValueOnce(formSubmissionEntity);
      formSubmissionMock.save.mockResolvedValueOnce(formSubmissionEntity);

      const handler = updateFormSubmissionDisposition(apiId, eventServiceMock, repositoryMock, formSubmissionMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(formSubmissionMock.getByFormIdAndSubmissionId).toBeCalled();
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

      formSubmissionMock.getByFormIdAndSubmissionId.mockResolvedValueOnce(null);
      formSubmissionMock.save.mockResolvedValueOnce(formSubmissionEntity);

      const handler = updateFormSubmissionDisposition(apiId, eventServiceMock, repositoryMock, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('form submission gets', () => {
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
      formSubmissionMock.getByFormIdAndSubmissionId.mockResolvedValueOnce(formSubmissionEntity);

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
      formSubmissionMock.getByFormIdAndSubmissionId.mockResolvedValueOnce(null);

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
      formSubmissionMock.getByFormIdAndSubmissionId.mockResolvedValueOnce(formSubmissionEntity);

      const handler = getFormSubmission(apiId, formSubmissionMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('find submissions endpoint', () => {
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

      expect(formSubmissionMock.find).toBeCalled();
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

      const formSubmissionEntity = new FormSubmissionEntity(formSubmissionMock, tenantId, formSubmissionInfo, entity);

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

      expect(formSubmissionMock.find).toBeCalled();
      expect(res.send).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
  describe('validate criteria', () => {
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
