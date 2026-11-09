import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ServiceRoles } from './roles';
import { createFeedbackRouter } from './router';

// Verifies the roles, request validation, and error responses documented in router.swagger.yml by sending requests
// through the feedback router as mounted in the service, with the real error handler.
describe('feedback router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const tenant = { id: tenantId, name: 'My Tenant', realm: 'test' };
  const site = 'https://my-application.alberta.ca';
  const documented = createDocumentedResponseRecorder(join(__dirname, 'router.swagger.yml'));

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
  const queueServiceMock = { enqueue: jest.fn(), getItems: jest.fn(), isConnected: jest.fn() };
  const valueServiceMock = { writeValue: jest.fn(), readValues: jest.fn(), readSummary: jest.fn() };
  const feedbackSiteServiceMock = {
    getAllSites: jest.fn(),
    countAllSites: jest.fn(),
    getTenantSites: jest.fn(),
    countTenantSites: jest.fn(),
  };

  const tenantUser = (roles: string[]) =>
    ({ id: 'tester', name: 'Test User', tenantId, isCore: false, roles }) as unknown as User;
  const coreUser = (roles: string[]) => ({ id: 'core', name: 'Core User', isCore: true, roles }) as unknown as User;
  const provider = tenantUser([ServiceRoles.FeedbackProvider]);
  const reader = tenantUser([ServiceRoles.FeedbackReader]);
  const plain = tenantUser([]);

  const configuration = (allowAnonymous: boolean, views?: { path: string }[]) => ({
    sites: { [site]: { url: new URL(site), allowAnonymous, views } },
  });

  async function createApp(currentUser: User | null, siteConfiguration = configuration(true)): Promise<Express> {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      // tenantHandler sets the tenant from the token for tenant users, and from tenantId for core users.
      req.tenant = currentUser && !currentUser.isCore ? tenant : req.query.tenantId ? tenant : undefined;
      req.getConfiguration = jest.fn().mockResolvedValue(siteConfiguration) as typeof req.getConfiguration;
      next();
    });
    app.use(
      '/feedback/v1',
      await createFeedbackRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock,
        queueService: queueServiceMock as never,
        valueService: valueServiceMock,
        feedbackSiteService: feedbackSiteServiceMock,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('POST /feedback/v1/feedback', () => {
    const feedback = { context: { site, view: '/apply' }, rating: 'good', comment: 'Easy to complete.' };

    it('queues feedback from a user with the feedback-provider role', async () => {
      const res = await request(await createApp(provider, configuration(false)))
        .post('/feedback/v1/feedback')
        .send(feedback);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sent: true });
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(expect.objectContaining({ tenantId: tenantId.toString() }));
    });

    it('queues anonymous feedback with the tenant in the body', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      const res = await request(await createApp(null))
        .post('/feedback/v1/feedback')
        .send({ ...feedback, tenant: 'My Tenant' });

      expect(res.status).toBe(200);
    });

    it('accepts feedback without a comment', async () => {
      const res = await request(await createApp(provider))
        .post('/feedback/v1/feedback')
        .send({ context: { site, view: '/apply' }, rating: 'neutral' });

      expect(res.status).toBe(200);
    });

    it('returns 400 for an invalid rating', async () => {
      const res = await request(await createApp(provider))
        .post('/feedback/v1/feedback')
        .send({ ...feedback, rating: 'great' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when there is no tenant context', async () => {
      const res = await request(await createApp(null))
        .post('/feedback/v1/feedback')
        .send(feedback);

      expect(res.status).toBe(400);
    });

    it('returns 400 when the site is not configured', async () => {
      const res = await request(await createApp(provider))
        .post('/feedback/v1/feedback')
        .send({ ...feedback, context: { site: 'https://unknown.alberta.ca', view: '/apply' } });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the view is not one of the site views', async () => {
      const res = await request(await createApp(provider, configuration(true, [{ path: '/start' }])))
        .post('/feedback/v1/feedback')
        .send(feedback);

      expect(res.status).toBe(400);
    });

    it('returns 401 for anonymous feedback on a site that does not allow it', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      const res = await request(await createApp(null, configuration(false)))
        .post('/feedback/v1/feedback')
        .send({ ...feedback, tenant: 'My Tenant' });

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without the feedback-provider role', async () => {
      const res = await request(await createApp(plain))
        .post('/feedback/v1/feedback')
        .send(feedback);

      expect(res.status).toBe(403);
    });

    it('returns 429 after 5 anonymous requests in 5 minutes', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValue(tenant);
      const app = await createApp(null);

      const statuses = [];
      for (let i = 0; i < 6; i++) {
        const res = await request(app)
          .post('/feedback/v1/feedback')
          .send({ ...feedback, tenant: 'My Tenant' });
        statuses.push(res.status);
      }

      expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    });
  });

  describe('GET /feedback/v1/feedback', () => {
    it('returns the feedback of the tenant', async () => {
      valueServiceMock.readValues.mockResolvedValueOnce({ feedback: [], page: { size: 0 } });

      const res = await request(await createApp(reader)).get('/feedback/v1/feedback?top=50');

      expect(res.status).toBe(200);
      expect(valueServiceMock.readValues).toHaveBeenCalledWith(tenantId, expect.objectContaining({ top: 50 }));
    });

    it('returns the feedback of all tenants for a core user without tenantId', async () => {
      valueServiceMock.readValues.mockResolvedValueOnce({ feedback: [], page: { size: 0 } });

      const res = await request(await createApp(coreUser([ServiceRoles.FeedbackReader]))).get('/feedback/v1/feedback');

      expect(res.status).toBe(200);
      expect(valueServiceMock.readValues).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('returns 400 for a core user with an invalid tenantId', async () => {
      const res = await request(await createApp(coreUser([ServiceRoles.FeedbackReader]))).get(
        '/feedback/v1/feedback?tenantId=not-a-urn',
      );

      expect(res.status).toBe(400);
    });

    it('returns 401 for a user without the feedback-reader role', async () => {
      const res = await request(await createApp(plain)).get('/feedback/v1/feedback');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /feedback/v1/feedback/summary', () => {
    it('returns the summary of the site', async () => {
      valueServiceMock.readSummary.mockResolvedValueOnce({
        totalResponses: 1,
        averageRating: 4,
        responsesWithComments: 1,
        responsesWithIssues: 0,
      });

      const res = await request(await createApp(reader)).get(`/feedback/v1/feedback/summary?site=${site}`);

      expect(res.status).toBe(200);
      expect(res.body.totalResponses).toBe(1);
    });

    it('returns 400 when site is not set', async () => {
      const res = await request(await createApp(reader)).get('/feedback/v1/feedback/summary');

      expect(res.status).toBe(400);
    });

    it('returns 401 for a user without the feedback-reader role', async () => {
      const res = await request(await createApp(plain)).get(`/feedback/v1/feedback/summary?site=${site}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /feedback/v1/sites', () => {
    const core = coreUser([ServiceRoles.FeedbackReader]);

    it('lists the sites of all tenants', async () => {
      feedbackSiteServiceMock.getAllSites.mockResolvedValueOnce([site]);

      const res = await request(await createApp(core)).get('/feedback/v1/sites');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([site]);
    });

    it('counts the sites of a tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);
      feedbackSiteServiceMock.countTenantSites.mockResolvedValueOnce(2);

      const res = await request(await createApp(core)).get('/feedback/v1/sites?tenant=my-tenant&count=true');

      expect(res.status).toBe(200);
      expect(res.body).toBe(2);
    });

    it('counts the sites of all tenants', async () => {
      feedbackSiteServiceMock.countAllSites.mockResolvedValueOnce(42);

      const res = await request(await createApp(core)).get('/feedback/v1/sites?count=true');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ count: 42 });
    });

    it('returns 400 when the tenant is not found', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(await createApp(core)).get('/feedback/v1/sites?tenant=unknown');

      expect(res.status).toBe(400);
    });

    it('returns 401 for a user without the feedback-reader role', async () => {
      const res = await request(await createApp(plain)).get('/feedback/v1/sites');

      expect(res.status).toBe(401);
    });
  });
});
