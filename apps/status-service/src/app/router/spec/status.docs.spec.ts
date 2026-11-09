import { adspId, AuditService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ApplicationRepo } from '../ApplicationRepo';
import { WebhookRepo } from '../WebhookRepo';
import { createNewApplication, deleteApplication, testWebhook, updateApplication } from '../serviceStatus';

// Verifies the responses documented in status.swagger.yml for the application create, update and delete operations
// and the webhook test operation. The handlers are mounted on the paths and behind the authentication check used by
// createServiceStatusRouter, with the real error handler.
describe('status router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, '..', 'status.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const tenantServiceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const auditServiceMock = { record: jest.fn(), flush: jest.fn() } as unknown as AuditService;
  const applicationRepoMock = {
    getTenantApps: jest.fn(),
    getApp: jest.fn(),
    createApp: jest.fn(),
    updateApp: jest.fn(),
    deleteApp: jest.fn(),
    findStatus: jest.fn(),
    mergeApplicationData: jest.fn(),
  };
  const webhookRepoMock = { getWebhook: jest.fn() };

  const user = { id: 'tester', name: 'tester', tenantId, isCore: false, roles: [] } as unknown as User;
  const app = { appKey: 'my-application', name: 'My Application', tenantId: tenantId.toString(), enabled: false };

  function createApp(currentUser: User | null): Express {
    const repo = applicationRepoMock as unknown as ApplicationRepo;
    const router = express.Router();
    router.post('/applications', assertAuthenticatedHandler, createNewApplication(loggerMock, repo, tenantServiceMock, auditServiceMock));
    router.put('/applications/:appKey', assertAuthenticatedHandler, updateApplication(loggerMock, repo, auditServiceMock));
    router.delete(
      '/applications/:appKey',
      assertAuthenticatedHandler,
      deleteApplication(loggerMock, repo, eventServiceMock, auditServiceMock),
    );
    router.get(
      '/webhook/:id/test/:eventName',
      assertAuthenticatedHandler,
      testWebhook(loggerMock, webhookRepoMock as unknown as WebhookRepo, repo, eventServiceMock),
    );

    const expressApp = express();
    expressApp.use(documented.middleware);
    expressApp.use(express.json());
    expressApp.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      next();
    });
    expressApp.use('/status/v1', router);
    expressApp.use(createErrorHandler(loggerMock));
    return expressApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('POST /status/v1/applications', () => {
    const body = { name: 'My Application', endpoint: { url: 'https://my-application.alberta.ca/health' } };

    it('adds the application', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce({ id: tenantId, name: 'test' });
      applicationRepoMock.getTenantApps.mockResolvedValueOnce([]);
      applicationRepoMock.createApp.mockResolvedValueOnce(app);

      const res = await request(createApp(user)).post('/status/v1/applications').send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(app);
    });

    it('returns 400 when an application with the same name exists', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce({ id: tenantId, name: 'test' });
      applicationRepoMock.getTenantApps.mockResolvedValueOnce([app]);

      const res = await request(createApp(user)).post('/status/v1/applications').send(body);

      expect(res.status).toBe(400);
      expect(applicationRepoMock.createApp).not.toHaveBeenCalled();
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).post('/status/v1/applications').send(body);

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /status/v1/applications/{appKey}', () => {
    const body = { name: 'Renamed', endpoint: { url: 'https://my-application.alberta.ca/health' } };

    it('updates the application', async () => {
      applicationRepoMock.getApp.mockResolvedValueOnce(app);
      applicationRepoMock.findStatus.mockResolvedValueOnce(null);
      applicationRepoMock.mergeApplicationData.mockReturnValueOnce({ ...app, name: 'Renamed' });

      const res = await request(createApp(user)).put('/status/v1/applications/my-application').send(body);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Renamed');
    });

    it('returns 404 when the application is not found', async () => {
      applicationRepoMock.getApp.mockResolvedValueOnce(null);

      const res = await request(createApp(user)).put('/status/v1/applications/my-application').send(body);

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).put('/status/v1/applications/my-application').send(body);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /status/v1/applications/{appKey}', () => {
    it('deletes the application', async () => {
      applicationRepoMock.getApp.mockResolvedValueOnce(app);
      applicationRepoMock.findStatus.mockResolvedValueOnce(null);

      const res = await request(createApp(user)).delete('/status/v1/applications/my-application');

      expect(res.status).toBe(204);
      expect(applicationRepoMock.deleteApp).toHaveBeenCalledWith('my-application', user);
    });

    it('returns 404 when the application is not found', async () => {
      applicationRepoMock.getApp.mockResolvedValueOnce(null);

      const res = await request(createApp(user)).delete('/status/v1/applications/my-application');

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).delete('/status/v1/applications/my-application');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /status/v1/webhook/{id}/test/{eventName}', () => {
    it('returns 404 when the webhook is not found', async () => {
      webhookRepoMock.getWebhook.mockResolvedValueOnce(null);

      const res = await request(createApp(user)).get('/status/v1/webhook/hook-1/test/monitored-service-down');

      expect(res.status).toBe(404);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('returns 404 when the application of the webhook is not found', async () => {
      webhookRepoMock.getWebhook.mockResolvedValueOnce({ id: 'hook-1', targetId: 'my-application' });
      applicationRepoMock.getApp.mockResolvedValueOnce(null);

      const res = await request(createApp(user)).get('/status/v1/webhook/hook-1/test/monitored-service-down');

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).get('/status/v1/webhook/hook-1/test/monitored-service-down');

      expect(res.status).toBe(401);
    });
  });
});
