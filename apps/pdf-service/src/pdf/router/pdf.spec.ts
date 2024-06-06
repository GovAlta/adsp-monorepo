import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { PDF_GENERATION_QUEUED } from '../events';
import { ServiceRoles } from '../roles';
import { createPdfRouter, generatePdf, getGeneratedFile, getTemplate, getTemplates } from './pdf';
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

  const configuration = {
    test: {
      id: 'test',
      name: 'Test template',
      description: 'This is a test.',
      template: '',
    },
  };

  beforeEach(() => {
    eventServiceMock.send.mockReset();
    queueServiceMock.enqueue.mockReset();
    repositoryMock.create.mockReset();
    repositoryMock.get.mockReset();
    fileServiceMock.typeExists.mockReset();
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
    });

    expect(router).toBeTruthy();
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

  describe('generatePdf', () => {
    it('can create handler', () => {
      const handler = generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
        serviceDirectoryMock
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
        serviceDirectoryMock
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
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, name: PDF_GENERATION_QUEUED })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'job1' }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
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
          formId: 'test-form-id',
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
        serviceDirectoryMock
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
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, name: PDF_GENERATION_QUEUED })
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
        serviceDirectoryMock
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
        serviceDirectoryMock
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
