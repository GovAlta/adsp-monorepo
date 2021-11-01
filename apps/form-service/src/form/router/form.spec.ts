import { adspId, Channel, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { accessForm, deleteForm, findForms, formOperation, getForm, getFormDefinition, updateFormData } from '.';
import { FormServiceRoles, FormStatus, FORM_SUBMITTED } from '..';
import { FormDefinitionEntity, FormEntity } from '../model';
import { createForm, createFormRouter, getFormDefinitions } from './form';

describe('form router', () => {
  const serviceId = adspId`urn:ads:platform:form-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const definition = new FormDefinitionEntity(tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
  });

  const subscriberId = adspId`urn:ads:platform:notification-service:v1:/subscribers/test`;
  const subscriber = {
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

  const eventServiceMock = {
    send: jest.fn(),
  };

  const notificationServiceMock = {
    getSubscriber: jest.fn(),
    subscribe: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const fileServiceMock = {
    delete: jest.fn(),
  };

  const formInfo = {
    id: 'test-form',
    created: new Date(),
    createdBy: { id: 'tester', name: 'tester' },
    status: FormStatus.Draft,
    locked: null,
    submitted: null,
    lastAccessed: new Date(),
    data: {},
    files: {},
  };
  const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

  beforeEach(() => {
    repositoryMock.save.mockClear();
    repositoryMock.get.mockReset();
    repositoryMock.delete.mockReset();
    notificationServiceMock.subscribe.mockReset();
    notificationServiceMock.sendCode.mockReset();
    notificationServiceMock.verifyCode.mockReset();
    eventServiceMock.send.mockReset();
  });

  it('can create router', () => {
    const router = createFormRouter({
      serviceId,
      repository: repositoryMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      notificationService: notificationServiceMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getFormDefinitions', () => {
    it('can get definitions', async () => {
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
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'test', name: 'test-form-definition' })])
      );
    });
  });

  describe('getFormDefinition', () => {
    it('can get definition', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      };
      const req = {
        user,
        params: { definitionId: 'test' },
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      await getFormDefinition(req as unknown as Request, res as unknown as Response, next);

      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'test', name: 'test-form-definition' }));
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
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      await getFormDefinition(req as unknown as Request, res as unknown as Response, next);

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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      repositoryMock.find.mockResolvedValueOnce({ results: [entity], page });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      repositoryMock.find.mockResolvedValueOnce({ results: [entity], page });

      const handler = findForms(apiId, repositoryMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('createForm', () => {
    it('can create handler', () => {
      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock);
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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      notificationServiceMock.subscribe.mockResolvedValueOnce(subscriber);

      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Draft }));
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
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
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getConfiguration.mockResolvedValueOnce([configuration]);

      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock);
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
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = { test: definition };
      req.getConfiguration.mockResolvedValueOnce([configuration]);

      const handler = createForm(apiId, repositoryMock, eventServiceMock, notificationServiceMock);
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
        params: { formId: 'test-form' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(null);
      const handler = getForm(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toBeCalledWith(expect.any(NotFoundError));
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
      const handler = deleteForm(fileServiceMock);
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
        body: { data: {}, files: {} },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(true);

      const handler = deleteForm(fileServiceMock);
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
        body: { data: {}, files: {} },
        params: { formId: 'test-form' },
        form: entity,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = deleteForm(fileServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('formOperation', () => {
    it('can create handler', () => {
      const handler = formOperation(apiId, eventServiceMock, notificationServiceMock);
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

      const handler = formOperation(apiId, eventServiceMock, notificationServiceMock);
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

      const handler = formOperation(apiId, eventServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Submitted }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: FORM_SUBMITTED }));
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

      const handler = formOperation(apiId, eventServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: FormStatus.Archived }));
    });

    it('can unlock form', async () => {
      const formInfo = {
        id: 'test-form',
        created: new Date(),
        createdBy: { id: 'tester', name: 'tester' },
        status: FormStatus.Locked,
        locked: null,
        submitted: null,
        lastAccessed: new Date(),
        data: {},
        files: {},
      };
      const locked = new FormEntity(repositoryMock, definition, subscriber, formInfo);

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

      const handler = formOperation(apiId, eventServiceMock, notificationServiceMock);
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

      const handler = formOperation(apiId, eventServiceMock, notificationServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });
});
