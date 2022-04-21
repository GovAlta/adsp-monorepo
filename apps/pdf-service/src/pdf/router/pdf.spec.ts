import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { PDF_GENERATION_QUEUED } from '../events';
import { ServiceRoles } from '../roles';
import { createPdfRouter, generatePdf, getGeneratedFile, getTemplate, getTemplates } from './pdf';

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
  });

  it('can create router', () => {
    const router = createPdfRouter({
      serviceId,
      logger: loggerMock,
      repository: repositoryMock,
      queueService: queueServiceMock,
      eventService: eventServiceMock,
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
      await getTemplate(req as unknown as Request, res as unknown as Response, next);
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
      await getTemplate(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('generatePdf', () => {
    it('can create handler', () => {
      const handler = generatePdf(repositoryMock, eventServiceMock, queueServiceMock);
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
      queueServiceMock.enqueue.mockResolvedValueOnce(null);
      const handler = generatePdf(repositoryMock, eventServiceMock, queueServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          work: 'generate',
          jobId: 'job1',
          templateId: req.body.templateId,
          data: req.body.data,
          filename: req.body.filename,
          generatedBy: expect.objectContaining({ id: req.user.id, name: req.user.name }),
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, name: PDF_GENERATION_QUEUED })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'job1' }));
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

      const handler = generatePdf(repositoryMock, eventServiceMock, queueServiceMock);
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
