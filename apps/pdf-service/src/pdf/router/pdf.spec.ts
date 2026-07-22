import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { PDF_GENERATION_QUEUED } from '../events';
import { ServiceRoles } from '../roles';
import {
  createPdfRouter,
  createPdfTemplate,
  deletePdfTemplate,
  generatePdf,
  getGeneratedFile,
  getTemplate,
  getTemplates,
  updatePdfTemplate,
} from './pdf';
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('pdf', () => {
  const serviceId = adspId`urn:ads:platform:pdf-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const fileServiceMock = {
    typeExists: jest.fn(),
    upload: jest.fn(),
  };

  const queueServiceMock = {
    enqueue: jest.fn(),
    getItems: jest.fn(),
    isConnected: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const configuration = {
    test: {
      id: 'test',
      name: 'Test template',
      description: 'This is a test.',
      template: '',
    },
  };

  const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
      status: jest.fn(),
      send: jest.fn(),
      json: jest.fn(),
    };

    (res.status as jest.Mock).mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    eventServiceMock.send.mockReset();
    queueServiceMock.enqueue.mockReset();
    repositoryMock.create.mockReset();
    repositoryMock.get.mockReset();
    fileServiceMock.typeExists.mockReset();
    axiosMock.patch.mockReset();
    serviceDirectoryMock.getServiceUrl.mockClear();
    tokenProviderMock.getAccessToken.mockReset();
  });

  const serviceDirectoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
    getResourceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
  };

  it('can create router', () => {
    const router = createPdfRouter({
      serviceId,
      logger: loggerMock,
      repository: repositoryMock,
      queueService: queueServiceMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      directory: serviceDirectoryMock,
      tokenProvider: tokenProviderMock,
    });

    expect(router).toBeTruthy();
  });

  // clean-code-ignore: 2.3
  describe('createPdfTemplate', () => {
    it('creates an empty PDF template', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        body: { name: 'new-template', description: 'New template description' },
        getConfiguration: jest.fn().mockResolvedValue([configuration]),
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await createPdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(serviceDirectoryMock.getServiceUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'platform',
          service: 'configuration-service',
          api: 'v2',
        }),
      );
      expect(tokenProviderMock.getAccessToken).toHaveBeenCalled();
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('v2/configuration/platform/pdf-service'),
        {
          operation: 'UPDATE',
          update: {
            'new-template': {
              id: 'new-template',
              name: 'new-template',
              description: 'New template description',
              template: '',
            },
          },
        },
        {
          headers: { Authorization: 'Bearer test-token' },
          params: { tenantId: tenantId.toString() },
        },
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        id: 'new-template',
        name: 'new-template',
        description: 'New template description',
        template: '',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates a dashed template ID from a name containing spaces', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        body: { name: 'we are the mushrooms', description: '' },
        getConfiguration: jest.fn().mockResolvedValue([{}]),
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await createPdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('v2/configuration/platform/pdf-service'),
        {
          operation: 'UPDATE',
          update: {
            'we-are-the-mushrooms': {
              id: 'we-are-the-mushrooms',
              name: 'we are the mushrooms',
              description: '',
              template: '',
            },
          },
        },
        {
          headers: { Authorization: 'Bearer test-token' },
          params: { tenantId: tenantId.toString() },
        },
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        id: 'we-are-the-mushrooms',
        name: 'we are the mushrooms',
        description: '',
        template: '',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('defaults the description to an empty string', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        body: { name: 'new-template' },
        getConfiguration: jest.fn().mockResolvedValue([{}]),
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await createPdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(res.json).toHaveBeenCalledWith({
        id: 'new-template',
        name: 'new-template',
        description: '',
        template: '',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns conflict when a template with the generated ID exists', async () => {
      const existingConfiguration = {
        'we-are-the-mushrooms': {
          id: 'we-are-the-mushrooms',
          name: 'Existing template',
          description: '',
          template: '',
        },
      };
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        body: { name: 'we are the mushrooms' },
        getConfiguration: jest.fn().mockResolvedValue([existingConfiguration]),
      };
      const res = createMockResponse();
      const next = jest.fn();

      await createPdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CONFLICT);
      expect(res.send).toHaveBeenCalledWith({
        error: "PDF template 'we are the mushrooms' already exists.",
      });
      expect(serviceDirectoryMock.getServiceUrl).not.toHaveBeenCalled();
      expect(tokenProviderMock.getAccessToken).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when the configuration update fails', async () => {
      const error = new Error('Configuration update failed');
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        body: { name: 'new-template' },
        getConfiguration: jest.fn().mockResolvedValue([{}]),
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockRejectedValueOnce(error);

      await createPdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('calls next with unauthorized when user does not have Admin role', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [] },
        body: { name: 'new-template' },
        getConfiguration: jest.fn().mockResolvedValue([{}]),
      };
      const res = createMockResponse();
      const next = jest.fn();

      await createPdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(serviceDirectoryMock.getServiceUrl).not.toHaveBeenCalled();
      expect(tokenProviderMock.getAccessToken).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    it('can get templates', async () => {
      const req = {
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      await getTemplates(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([configuration.test]));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('includes additionalStyles and variables in the mapped templates', async () => {
      const req = {
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      req.getConfiguration.mockResolvedValueOnce([
        {
          styled: {
            id: 'styled',
            name: 'Styled template',
            description: 'Has styles.',
            template: '<p>body</p>',
            header: '<h1>header</h1>',
            footer: '<p>footer</p>',
            additionalStyles: '.a { color: red; }',
            variables: '{"foo":"bar"}',
          },
        },
      ]);
      await getTemplates(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'styled',
          additionalStyles: '.a { color: red; }',
          variables: '{"foo":"bar"}',
        }),
      ]);
    });

    it('can call next for error', async () => {
      const req = {
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      req.getConfiguration.mockRejectedValueOnce(new Error('oh noes!'));
      await getTemplates(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('getTemplate', () => {
    it('can create handler', () => {
      const handler = getTemplate('params');
      expect(handler).toBeTruthy();
    });

    it('can get template', async () => {
      const req = {
        params: {
          templateId: 'test',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      const handler = getTemplate('params');
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith();
      expect(req['template']).toBe(configuration.test);
    });

    it('can get template by body property', async () => {
      const req = {
        body: {
          templateId: 'test',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      const handler = getTemplate('body');
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith();
      expect(req['template']).toBe(configuration.test);
    });

    it('can call next with not found', async () => {
      const req = {
        params: {
          templateId: 'test',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      req.getConfiguration.mockResolvedValueOnce([{}]);
      const handler = getTemplate('params');
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('updatePdfTemplate', () => {
    const existingTemplate = {
      id: 'test',
      name: 'Test template',
      description: 'This is a test.',
      template: '<p>Old body</p>',
      header: '<h1>Old header</h1>',
      footer: '<p>Old footer</p>',
    };

    it('can create handler', () => {
      const handler = updatePdfTemplate(serviceDirectoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('updates a PDF template and returns 201', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
        body: { template: '<p>New body</p>', header: '<h1>New header</h1>', footer: '<p>New footer</p>' },
        template: existingTemplate,
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await updatePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('v2/configuration/platform/pdf-service'),
        {
          operation: 'UPDATE',
          update: {
            test: {
              id: 'test',
              name: 'Test template',
              description: 'This is a test.',
              template: '<p>New body</p>',
              header: '<h1>New header</h1>',
              footer: '<p>New footer</p>',
            },
          },
        },
        {
          headers: { Authorization: 'Bearer test-token' },
          params: { tenantId: tenantId.toString() },
        },
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        id: 'test',
        name: 'Test template',
        description: 'This is a test.',
        template: '<p>New body</p>',
        header: '<h1>New header</h1>',
        footer: '<p>New footer</p>',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('updates name, description, additionalStyles, and variables when provided', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
        body: {
          name: 'Renamed template',
          description: 'Updated description.',
          additionalStyles: '.a { color: red; }',
          variables: '{"foo":"bar"}',
        },
        template: existingTemplate,
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await updatePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test',
          name: 'Renamed template',
          description: 'Updated description.',
          template: '<p>Old body</p>',
          header: '<h1>Old header</h1>',
          footer: '<p>Old footer</p>',
          additionalStyles: '.a { color: red; }',
          variables: '{"foo":"bar"}',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('preserves existing additionalStyles and variables when not in the request body', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
        body: { template: '<p>New body only</p>' },
        template: {
          ...existingTemplate,
          additionalStyles: '.keep { color: blue; }',
          variables: '{"kept":true}',
        },
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await updatePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          template: '<p>New body only</p>',
          additionalStyles: '.keep { color: blue; }',
          variables: '{"kept":true}',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('preserves existing fields not included in the request body', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
        body: { template: '<p>New body only</p>' },
        template: existingTemplate,
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await updatePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          template: '<p>New body only</p>',
          header: '<h1>Old header</h1>',
          footer: '<p>Old footer</p>',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with unauthorized when user does not have Admin role', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [] },
        params: { templateId: 'test' },
        body: { template: '<p>New body</p>' },
        template: existingTemplate,
      };
      const res = createMockResponse();
      const next = jest.fn();

      await updatePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next when the configuration update fails', async () => {
      const error = new Error('Configuration update failed');
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
        body: { template: '<p>New body</p>' },
        template: existingTemplate,
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockRejectedValueOnce(error);

      await updatePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('calls next when tenant is missing', async () => {
      const req = {
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
        body: { template: '<p>New body</p>' },
        template: existingTemplate,
      };
      const res = createMockResponse();
      const next = jest.fn();

      await updatePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(TypeError));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('deletePdfTemplate', () => {
    it('can create handler', () => {
      const handler = deletePdfTemplate(serviceDirectoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('deletes a PDF template and returns 204', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await deletePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(serviceDirectoryMock.getServiceUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'platform',
          service: 'configuration-service',
          api: 'v2',
        }),
      );
      expect(tokenProviderMock.getAccessToken).toHaveBeenCalled();
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('v2/configuration/platform/pdf-service'),
        { operation: 'DELETE', property: 'test' },
        {
          headers: { Authorization: 'Bearer test-token' },
          params: { tenantId: tenantId.toString() },
        },
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.NO_CONTENT);
      expect(res.send).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with unauthorized when user does not have Admin role', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [] },
        params: { templateId: 'test' },
      };
      const res = createMockResponse();
      const next = jest.fn();

      await deletePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(serviceDirectoryMock.getServiceUrl).not.toHaveBeenCalled();
      expect(tokenProviderMock.getAccessToken).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next when the configuration delete fails', async () => {
      const error = new Error('Configuration delete failed');
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');
      axiosMock.patch.mockRejectedValueOnce(error);

      await deletePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next when serviceDirectory lookup fails', async () => {
      const error = new Error('Directory lookup failed');
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockRejectedValueOnce(error);

      await deletePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next when token provider fails', async () => {
      const error = new Error('Token fetch failed');
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockRejectedValueOnce(error);

      await deletePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next when tenant is missing', async () => {
      const req = {
        user: { tenantId, id: 'test', name: 'tester', roles: [ServiceRoles.Admin] },
        params: { templateId: 'test' },
      };
      const res = createMockResponse();
      const next = jest.fn();

      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost:80'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('test-token');

      await deletePdfTemplate(serviceDirectoryMock, tokenProviderMock)(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(TypeError));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('generatePdf', () => {
    it('can create handler', () => {
      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
      );
      expect(handler).toBeTruthy();
    });

    it('can generate pdf', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [ServiceRoles.PdfGenerator],
        },
        body: {
          templateId: 'test',
          filename: 'test.pdf',
          data: {},
        },
        template: configuration.test,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.create.mockResolvedValueOnce({ id: 'job1' });
      fileServiceMock.typeExists.mockResolvedValueOnce(true);
      queueServiceMock.enqueue.mockResolvedValueOnce(null);
      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          work: 'generate',
          jobId: 'job1',
          templateId: req.body.templateId,
          data: req.body.data,
          filename: req.body.filename,
          requestedBy: expect.objectContaining({ id: req.user.id, name: req.user.name }),
        }),
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, name: PDF_GENERATION_QUEUED }),
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'job1' }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('with external tenant data it can generate pdf ', async () => {
      const req = {
        query: {
          tenantId: tenantId.toString(),
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [ServiceRoles.PdfGenerator],
        },
        body: {
          templateId: 'test',
          filename: 'test.pdf',
          data: {},
        },
        template: configuration.test,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.create.mockResolvedValueOnce({ id: 'job1' });
      fileServiceMock.typeExists.mockResolvedValueOnce(true);
      queueServiceMock.enqueue.mockResolvedValueOnce(null);
      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          work: 'generate',
          jobId: 'job1',
          templateId: req.body.templateId,
          data: req.body.data,
          filename: req.body.filename,
          requestedBy: expect.objectContaining({ id: req.user.id, name: req.user.name }),
        }),
      );

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'job1' }));
    });
    it('can not generate pdf without tenantId', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [ServiceRoles.PdfGenerator],
        },
        body: {
          templateId: 'test',
          filename: 'test.pdf',
          data: {},
        },
        template: configuration.test,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.create.mockResolvedValueOnce({ id: 'job1' });
      fileServiceMock.typeExists.mockResolvedValueOnce(true);
      queueServiceMock.enqueue.mockResolvedValueOnce(null);
      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(TypeError));
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can generate core pdf', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [ServiceRoles.PdfGenerator],
          token: { bearer: 'abc' },
        },
        body: {
          templateId: 'test',
          filename: 'test.pdf',
          data: {},
        },
        template: configuration.test,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.create.mockResolvedValueOnce({ id: 'job1' });
      fileServiceMock.typeExists.mockResolvedValueOnce(true);
      queueServiceMock.enqueue.mockResolvedValueOnce(null);

      axiosMock.get
        .mockResolvedValueOnce({
          data: {
            results: [{ id: 'formId' }],
          },
        })
        .mockResolvedValueOnce({ data: { firstName: 'bob', lastName: 'smith' } });

      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          work: 'generate',
          jobId: 'job1',
          templateId: req.body.templateId,
          data: req.body.data,
          filename: req.body.filename,
          requestedBy: expect.objectContaining({ id: req.user.id, name: req.user.name }),
        }),
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, name: PDF_GENERATION_QUEUED }),
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'job1' }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with invalid operation', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [ServiceRoles.PdfGenerator],
        },
        body: {
          templateId: 'test',
          filename: 'test.pdf',
          fileType: 'my-test-type',
          data: {},
        },
        template: configuration.test,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.create.mockResolvedValueOnce({ id: 'job1' });
      fileServiceMock.typeExists.mockResolvedValueOnce(false);
      queueServiceMock.enqueue.mockResolvedValueOnce(null);
      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [],
        },
        body: {
          templateId: 'test',
          filename: 'test.pdf',
          data: {},
        },
        template: configuration.test,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('getGeneratedFile', () => {
    it('can create handler', () => {
      const handler = getGeneratedFile(serviceId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get file', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [ServiceRoles.PdfGenerator],
        },
        params: {
          jobId: 'job1',
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce({ tenantId, id: req.params.jobId, status: 'completed' });
      const handler = getGeneratedFile(serviceId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: req.params.jobId, status: 'completed' }));
      expect(next).not.toHaveBeenCalled();
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with not found', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [ServiceRoles.PdfGenerator],
        },
        params: {
          jobId: 'job1',
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(null);
      const handler = getGeneratedFile(serviceId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test',
          name: 'tester',
          roles: [],
        },
        params: {
          jobId: 'job1',
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce({ tenantId, id: req.params.jobId, status: 'completed' });
      const handler = getGeneratedFile(serviceId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
