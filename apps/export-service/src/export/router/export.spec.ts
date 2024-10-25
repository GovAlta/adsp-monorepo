import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createExportJob, createExportRouter, getExportJob } from './export';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { ServiceRoles } from '../roles';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { ExportQueuedDefinition } from '../event';
import { EXPORT_FILE } from '../fileTypes';

describe('export', () => {
  const serviceId = adspId`urn:ads:platform:test-service`;
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
    delete: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const fileServiceMock = {
    typeExists: jest.fn(),
    upload: jest.fn(),
  };

  const queueServiceMock = {
    isConnected: jest.fn(),
    enqueue: jest.fn(),
    getItems: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.create.mockReset();
    repositoryMock.get.mockReset();
    fileServiceMock.typeExists.mockReset();
    queueServiceMock.enqueue.mockClear();
    eventServiceMock.send.mockClear();
  });

  it('can create router', () => {
    const router = createExportRouter({
      serviceId,
      logger: loggerMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      repository: repositoryMock,
      queueService: queueServiceMock,
    });
    expect(router).toBeTruthy();
  });

  describe('createExportJob', () => {
    it('can create handler', () => {
      const handler = createExportJob(
        serviceId,
        loggerMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        repositoryMock
      );
      expect(handler).toBeTruthy();
    });

    it('can create export job', async () => {
      const req = {
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.Exporter] },
        tenant: {
          id: tenantId,
        },
        body: {
          format: 'csv',
          resourceId: 'urn:ads:platform:test-service:v1:/tests',
        },
      };

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      const job = {
        id: '123',
        status: 'completed',
        result: null,
      };
      repositoryMock.create.mockResolvedValueOnce(job);

      const handler = createExportJob(
        serviceId,
        loggerMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: job.id, status: job.status }));
      expect(repositoryMock.create).toHaveBeenCalledWith(tenantId);
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: job.id,
          format: req.body.format,
          fileType: EXPORT_FILE,
          resourceId: req.body.resourceId,
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: ExportQueuedDefinition.name,
        })
      );
    });

    it('can call next with unauthorized', async () => {
      const req = {
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        tenant: {
          id: tenantId,
        },
        body: {
          format: 'csv',
          resourceId: 'urn:ads:platform:test-service:v1:/tests',
        },
      };

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      const handler = createExportJob(
        serviceId,
        loggerMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can create export job with file type', async () => {
      const req = {
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.Exporter] },
        tenant: {
          id: tenantId,
        },
        body: {
          format: 'csv',
          resourceId: 'urn:ads:platform:test-service:v1:/tests',
          fileType: 'custom-type',
        },
      };

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      fileServiceMock.typeExists.mockResolvedValueOnce(true);

      const job = {
        id: '123',
        status: 'completed',
        result: null,
      };
      repositoryMock.create.mockResolvedValueOnce(job);

      const handler = createExportJob(
        serviceId,
        loggerMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: job.id, status: job.status }));
      expect(repositoryMock.create).toHaveBeenCalledWith(tenantId);
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: job.id,
          format: req.body.format,
          fileType: req.body.fileType,
          resourceId: req.body.resourceId,
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: ExportQueuedDefinition.name,
        })
      );
    });

    it('can call next with invalid operation for missing file type', async () => {
      const req = {
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.Exporter] },
        tenant: {
          id: tenantId,
        },
        body: {
          format: 'csv',
          resourceId: 'urn:ads:platform:test-service:v1:/tests',
          fileType: 'custom-type',
        },
      };

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      fileServiceMock.typeExists.mockResolvedValueOnce(false);

      const handler = createExportJob(
        serviceId,
        loggerMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        repositoryMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getExportJob', () => {
    it('can create handler', () => {
      const handler = getExportJob(serviceId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can handle get job request', async () => {
      const req = {
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.Exporter] },
        tenant: {
          id: tenantId,
        },
        params: {
          jobId: '123',
        },
      };

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();
      const job = {
        id: '123',
        status: 'completed',
        result: null,
      };
      repositoryMock.get.mockResolvedValueOnce(job);

      const handler = getExportJob(serviceId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(job));
    });

    it('can call next with unauthorized', async () => {
      const req = {
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        tenant: {
          id: tenantId,
        },
        params: {
          jobId: '123',
        },
      };

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();
      const job = {
        id: '123',
        status: 'completed',
        result: null,
      };
      repositoryMock.get.mockResolvedValueOnce(job);

      const handler = getExportJob(serviceId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with not found', async () => {
      const req = {
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.Exporter] },
        tenant: {
          id: tenantId,
        },
        params: {
          jobId: '123',
        },
      };

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(null);

      const handler = getExportJob(serviceId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
