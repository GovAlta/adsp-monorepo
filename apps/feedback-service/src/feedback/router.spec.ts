import { AdspId, TenantService, UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError, WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { RateLimitRequestHandler } from 'express-rate-limit';
import { FeedbackWorkItem } from './job';
import {
  createFeedbackRouter,
  downloadWidgetScript,
  getWidgetScriptIntegrity,
  resolveFeedbackContext,
  sendFeedback,
  readValues,
} from './router';
import { ServiceRoles } from './roles';
import { ValueService } from './value';

describe('router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tenantServiceMock = {
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
  };

  const queueServiceMock = {
    enqueue: jest.fn(),
  };

  const valueServiceMock = {
    writeValue: jest.fn(),
    readValues: jest.fn(),
  };

  beforeEach(() => {
    tenantServiceMock.getTenant.mockReset();
    tenantServiceMock.getTenantByName.mockReset();
    queueServiceMock.enqueue.mockReset();
    valueServiceMock.writeValue.mockReset();
    valueServiceMock.readValues.mockReset();
  });

  describe('createFeedbackRouter', () => {
    it('can create router', async () => {
      const router = await createFeedbackRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock as unknown as TenantService,
        queueService: queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>,
        valueService: valueServiceMock,
      });
      expect(router).toBeTruthy();
    });
  });

  describe('resolveFeedbackContext', () => {
    it('can create handler', () => {
      const handler = resolveFeedbackContext(
        tenantServiceMock as unknown as TenantService,
        jest.fn() as unknown as RateLimitRequestHandler
      );
      expect(handler).toBeTruthy();
    });

    it('can resolve tenant from request body', async () => {
      const req = {
        tenant: null,
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          tenant: tenantId.toString(),
        },
      };
      const res = {};
      const next = jest.fn();

      tenantServiceMock.getTenant.mockResolvedValueOnce({ id: tenantId });
      const handler = resolveFeedbackContext(
        tenantServiceMock as unknown as TenantService,
        jest.fn() as unknown as RateLimitRequestHandler
      );
      await handler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
      expect(tenantServiceMock.getTenant).toHaveBeenCalledWith(expect.any(AdspId));
      expect(req.tenant.id.toString()).toBe(tenantId.toString());
    });

    it('can resolve tenant from request body as name', async () => {
      const req = {
        tenant: null,
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          tenant: 'test-tenant',
        },
      };
      const res = {};
      const next = jest.fn();

      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId });
      const handler = resolveFeedbackContext(
        tenantServiceMock as unknown as TenantService,
        jest.fn() as unknown as RateLimitRequestHandler
      );
      await handler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('test tenant');
      expect(req.tenant.id.toString()).toBe(tenantId.toString());
    });

    it('can ignore tenant from request body', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          tenant: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        },
      };
      const res = {};
      const next = jest.fn();

      const handler = resolveFeedbackContext(
        tenantServiceMock as unknown as TenantService,
        jest.fn() as unknown as RateLimitRequestHandler
      );
      await handler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
      expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
      expect(req.tenant.id.toString()).toBe(tenantId.toString());
    });

    it('can call next with unauthorized user', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [] },
        body: {},
      };
      const res = {};
      const next = jest.fn();

      const handler = resolveFeedbackContext(
        tenantServiceMock as unknown as TenantService,
        jest.fn() as unknown as RateLimitRequestHandler
      );
      await handler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(req.tenant.id.toString()).toBe(tenantId.toString());
    });

    it('can call next with invalid operation for no tenant context', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {},
      };
      const res = {};
      const next = jest.fn();

      tenantServiceMock.getTenant.mockResolvedValueOnce({ id: tenantId });
      const handler = resolveFeedbackContext(
        tenantServiceMock as unknown as TenantService,
        jest.fn() as unknown as RateLimitRequestHandler
      );
      await handler(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can rate limit anonymous', async () => {
      const req = {
        tenant: null,
        body: {
          tenant: tenantId.toString(),
        },
      };
      const res = {};
      const next = jest.fn();
      const rateLimitHandler = jest.fn();

      tenantServiceMock.getTenant.mockResolvedValueOnce({ id: tenantId });
      const handler = resolveFeedbackContext(
        tenantServiceMock as unknown as TenantService,
        rateLimitHandler as unknown as RateLimitRequestHandler
      );
      await handler(req as Request, res as Response, next);
      expect(rateLimitHandler).toHaveBeenCalledWith(req, res, next);
    });
  });

  describe('sendFeedback', () => {
    it('can create handler', () => {
      const handler = sendFeedback(loggerMock, queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>);
      expect(handler).toBeTruthy();
    });

    it('can send feedback', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ sites: { 'http://test.org': { url: 'http://test.org' } } });
      queueServiceMock.enqueue.mockResolvedValueOnce(undefined);

      const handler = sendFeedback(loggerMock, queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ sent: true }));
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: tenantId.toString(),
          timestamp: expect.any(String),
          digest: expect.any(String),
          feedback: expect.objectContaining(req.body),
        })
      );
    });

    it('can send anonymous feedback', async () => {
      const req = {
        tenant: { id: tenantId },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({
        sites: { 'http://test.org': { url: 'http://test.org', allowAnonymous: true } },
      });
      queueServiceMock.enqueue.mockResolvedValueOnce(undefined);

      const handler = sendFeedback(loggerMock, queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ sent: true }));
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: tenantId.toString(),
          timestamp: expect.any(String),
          digest: expect.any(String),
          feedback: expect.objectContaining(req.body),
        })
      );
    });

    it('can call next with invalid operation for unknown site', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ sites: {} });
      queueServiceMock.enqueue.mockResolvedValueOnce(undefined);

      const handler = sendFeedback(loggerMock, queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(res.json).not.toHaveBeenCalled();
      expect(queueServiceMock.enqueue).not.toHaveBeenCalled();
    });

    it('can call next with unauthorized for anonymous request on site that does not allow anonymous', async () => {
      const req = {
        tenant: { id: tenantId },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ sites: { 'http://test.org': { url: 'http://test.org' } } });
      queueServiceMock.enqueue.mockResolvedValueOnce(undefined);

      const handler = sendFeedback(loggerMock, queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(res.json).not.toHaveBeenCalled();
      expect(queueServiceMock.enqueue).not.toHaveBeenCalled();
    });

    it('can call next with invalid operation for unknown view', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          context: { site: 'http://test.org', view: '/test' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({
        sites: { 'http://test.org': { url: 'http://test.org', views: [{ path: '/' }] } },
      });
      queueServiceMock.enqueue.mockResolvedValueOnce(undefined);

      const handler = sendFeedback(loggerMock, queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(res.json).not.toHaveBeenCalled();
      expect(queueServiceMock.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('downloadWidgetScript', () => {
    const getWidgetInformation = jest.fn();

    it('can create handler', () => {
      const handler = downloadWidgetScript(getWidgetInformation);
      expect(handler).toBeTruthy();
    });

    it('can download script', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };
      const next = jest.fn();

      getWidgetInformation.mockResolvedValueOnce({ length: 200, script: 'abc123' });

      const handler = downloadWidgetScript(getWidgetInformation);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/javascript; charset=utf-8');
      expect(res.send).toHaveBeenCalledWith('abc123');
    });

    it('can call next with error', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      getWidgetInformation.mockRejectedValueOnce(new Error('oh noes!'));

      const handler = downloadWidgetScript(getWidgetInformation);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).not.toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getWidgetScriptIntegrity', () => {
    const getWidgetInformation = jest.fn();

    it('can create handler', () => {
      const handler = getWidgetScriptIntegrity(getWidgetInformation);
      expect(handler).toBeTruthy();
    });

    it('can get script integrity', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      getWidgetInformation.mockResolvedValueOnce({ integrity: 'abc123' });

      const handler = getWidgetScriptIntegrity(getWidgetInformation);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ integrity: 'abc123' }));
    });

    it('can call next with error', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackProvider] },
        body: {
          context: { site: 'http://test.org', view: '/' },
          rating: 'good',
          comment: 'This is a comment',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      getWidgetInformation.mockRejectedValueOnce(new Error('oh noes!'));

      const handler = getWidgetScriptIntegrity(getWidgetInformation);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).not.toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getFeedback', () => {
    it('can get feedback', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackReader] },
        query: { site: 'http://test.org', top: '10', after: '' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      const handler = readValues(valueServiceMock as unknown as ValueService);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(valueServiceMock.readValues).toHaveBeenCalledWith(tenantId, {
        site: 'http://test.org',
        top: 10,
      });
    });

    it('calls next without site query parameter', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.FeedbackReader] },
        query: { top: '10', after: '' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      const handler = readValues(valueServiceMock as unknown as ValueService);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(valueServiceMock.readValues).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('calls next if no tenant', async () => {
      const req = {
        query: { top: '10', after: '' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      const handler = readValues(valueServiceMock as unknown as ValueService);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(valueServiceMock.readValues).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });
});
