import { adspId, AdspId, AuditService, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios from 'axios';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../../model';
import { ServiceStatusRepository } from '../../repository/serviceStatus';
import { EndpointStatusEntryRepository } from '../../repository/endpointStatusEntry';
import { createServiceStatusRouter } from '../serviceStatus';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

// Verifies the responses documented in status.swagger.yml. The real router is mounted at the main.ts path, with the
// service error handler last; only the repositories, SDK services, and HTTP calls to the configuration service are
// mocked.
describe('status router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61e9adcc9423490012a9ae46`;
  const serviceId = adspId`urn:ads:platform:status-service`;
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
  const tokenProviderMock = { getAccessToken: jest.fn() };
  const directoryMock = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const configurationServiceMock = { getConfiguration: jest.fn() };
  const serviceStatusRepositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    findEnabledApplications: jest.fn(),
    save: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    delete: jest.fn(),
  };
  const endpointStatusEntryRepositoryMock = {
    findRecentByUrlAndApplicationId: jest.fn(),
    findRecent: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    deleteAll: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const user = { id: 'tester', name: 'Test User', tenantId, isCore: false, roles: [] } as unknown as User;
  const coreUser = { id: 'core', name: 'Core User', isCore: true, roles: [] } as unknown as User;
  const appKey = 'my-application';
  const statusConfiguration = {
    [appKey]: {
      appKey,
      name: 'My Application',
      description: 'Online application for a benefit program.',
      url: 'https://my-application.alberta.ca/health',
      monitorOnly: false,
    },
  };
  const webhook = {
    id: 'my-application-webhook',
    url: 'https://my-application.alberta.ca/webhook',
    name: 'My application webhook',
    targetId: appKey,
    intervalMinutes: 5,
    eventTypes: [{ id: 'status-service:monitored-service-down' }],
    description: 'Notifies the team when the application is down.',
  };
  const entry = {
    url: 'https://my-application.alberta.ca/health',
    ok: true,
    timestamp: 1794326400000,
    responseTime: 178,
    status: 200,
    applicationId: appKey,
    tenantId: tenantId.toString(),
  };

  function createStatus(enabled: boolean) {
    return new ServiceStatusApplicationEntity(serviceStatusRepositoryMock as unknown as ServiceStatusRepository, {
      _id: '6730c4f1a2b3c4d5e6f70812',
      appKey,
      endpoint: { status: 'online' },
      metadata: '',
      statusTimestamp: 1794326400000,
      status: 'operational',
      enabled,
      tenantId: tenantId.toString(),
    });
  }

  function createApp(currentUser: User | null): Express {
    const expressApp = express();
    expressApp.use(documented.middleware);
    expressApp.use(express.json());
    expressApp.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      next();
    });
    expressApp.use(
      '/status/v1',
      createServiceStatusRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock,
        eventService: eventServiceMock,
        auditService: auditServiceMock,
        serviceStatusRepository: serviceStatusRepositoryMock as unknown as ServiceStatusRepository,
        endpointStatusEntryRepository: endpointStatusEntryRepositoryMock as unknown as EndpointStatusEntryRepository,
        tokenProvider: tokenProviderMock,
        directory: directoryMock,
        serviceId,
        configurationService: configurationServiceMock as unknown as ConfigurationService,
      }),
    );
    expressApp.use(createErrorHandler(loggerMock));
    return expressApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    tokenProviderMock.getAccessToken.mockResolvedValue('token');
    directoryMock.getServiceUrl.mockResolvedValue(new URL('https://configuration-service.adsp.alberta.ca'));
    axiosMock.patch.mockResolvedValue({ data: {} });
    configurationServiceMock.getConfiguration.mockImplementation((id: AdspId) =>
      Promise.resolve(
        id.toString() === 'urn:ads:platform:push-service'
          ? { webhooks: { [webhook.id]: webhook } }
          : statusConfiguration,
      ),
    );
    serviceStatusRepositoryMock.find.mockResolvedValue([createStatus(true)]);
    serviceStatusRepositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
    serviceStatusRepositoryMock.enable.mockResolvedValue(createStatus(true));
    serviceStatusRepositoryMock.disable.mockResolvedValue(createStatus(false));
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /status/v1/applications', () => {
    it('retrieves the applications of the tenant', async () => {
      const res = await request(createApp(user)).get('/status/v1/applications');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({ appKey, name: 'My Application', status: 'operational', enabled: true }),
      ]);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).get('/status/v1/applications');

      expect(res.status).toBe(401);
    });

    it('returns 401 for a token without a tenant context', async () => {
      const res = await request(createApp(coreUser)).get('/status/v1/applications');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /status/v1/applications', () => {
    const body = { name: 'New Application', endpoint: { url: 'https://new-application.alberta.ca/health' } };

    beforeEach(() => {
      tenantServiceMock.getTenant.mockResolvedValue({ id: tenantId, name: 'My Tenant' });
    });

    it('adds the application', async () => {
      const res = await request(createApp(user)).post('/status/v1/applications').send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(expect.objectContaining({ appKey: 'new-application', enabled: false }));
      expect(axiosMock.patch).toHaveBeenCalled();
    });

    it('returns 400 when an application with the same name exists', async () => {
      const res = await request(createApp(user))
        .post('/status/v1/applications')
        .send({ ...body, name: 'My Application' });

      expect(res.status).toBe(400);
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).post('/status/v1/applications').send(body);

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /status/v1/applications/{appKey}', () => {
    const body = { name: 'Renamed', endpoint: { url: 'https://my-application.alberta.ca/health' } };

    it('updates the application', async () => {
      const res = await request(createApp(user)).put(`/status/v1/applications/${appKey}`).send(body);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Renamed');
    });

    it('returns 404 when the application is not found', async () => {
      const res = await request(createApp(user)).put('/status/v1/applications/other-application').send(body);

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).put(`/status/v1/applications/${appKey}`).send(body);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /status/v1/applications/{appKey}', () => {
    it('deletes the application', async () => {
      const res = await request(createApp(user)).delete(`/status/v1/applications/${appKey}`);

      expect(res.status).toBe(204);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'health-check-stopped' }));
    });

    it('returns 404 when the application is not found', async () => {
      const res = await request(createApp(user)).delete('/status/v1/applications/other-application');

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).delete(`/status/v1/applications/${appKey}`);

      expect(res.status).toBe(401);
    });
  });

  describe.each(['enable', 'disable', 'toggle'])('PATCH /status/v1/applications/{appKey}/%s', (action) => {
    it('changes monitoring of the application', async () => {
      const res = await request(createApp(user)).patch(`/status/v1/applications/${appKey}/${action}`);

      expect(res.status).toBe(200);
      expect(res.body.appKey).toBe(appKey);
    });

    it('returns 404 when the application is not found', async () => {
      const res = await request(createApp(user)).patch(`/status/v1/applications/other-application/${action}`);

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).patch(`/status/v1/applications/${appKey}/${action}`);

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /status/v1/applications/{appKey}/status', () => {
    it('sets the status and sends the status changed event', async () => {
      const res = await request(createApp(user))
        .patch(`/status/v1/applications/${appKey}/status`)
        .send({ status: 'maintenance' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('maintenance');
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'application-status-changed' }),
      );
    });

    it('returns 404 when the application is not found', async () => {
      const res = await request(createApp(user))
        .patch('/status/v1/applications/other-application/status')
        .send({ status: 'maintenance' });

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null))
        .patch(`/status/v1/applications/${appKey}/status`)
        .send({ status: 'maintenance' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /status/v1/applications/{appKey}/endpoint-status-entries', () => {
    it('retrieves the ping results of the application', async () => {
      endpointStatusEntryRepositoryMock.findRecentByUrlAndApplicationId.mockResolvedValueOnce([entry]);

      const res = await request(createApp(user)).get(
        `/status/v1/applications/${appKey}/endpoint-status-entries?topValue=20`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ applicationId: appKey, appKey, ok: true })]);
      expect(endpointStatusEntryRepositoryMock.findRecentByUrlAndApplicationId).toHaveBeenCalledWith(
        entry.url,
        appKey,
        tenantId.toString(),
        20,
      );
    });

    it('returns 404 when the application is not found', async () => {
      const res = await request(createApp(user)).get(
        '/status/v1/applications/other-application/endpoint-status-entries',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /status/v1/applications/endpoint-status-entries', () => {
    it('retrieves the recent ping results', async () => {
      endpointStatusEntryRepositoryMock.findRecent.mockResolvedValueOnce([entry]);

      const res = await request(createApp(user)).get('/status/v1/applications/endpoint-status-entries?ageInMinutes=20');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(endpointStatusEntryRepositoryMock.findRecent).toHaveBeenCalledWith(20);
    });
  });

  describe('GET /status/v1/webhook/{id}/test/{eventName}', () => {
    it('sends the test event', async () => {
      const res = await request(createApp(user)).get(`/status/v1/webhook/${webhook.id}/test/monitored-service-down`);

      expect(res.status).toBe(200);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'monitored-service-down' }));
    }, 10000);

    it('returns 404 when the webhook is not found', async () => {
      const res = await request(createApp(user)).get('/status/v1/webhook/other-webhook/test/monitored-service-down');

      expect(res.status).toBe(404);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('returns 404 when the application of the webhook is not found', async () => {
      configurationServiceMock.getConfiguration.mockImplementation((id: AdspId) =>
        Promise.resolve(
          id.toString() === 'urn:ads:platform:push-service' ? { webhooks: { [webhook.id]: webhook } } : {},
        ),
      );

      const res = await request(createApp(user)).get(`/status/v1/webhook/${webhook.id}/test/monitored-service-down`);

      expect(res.status).toBe(404);
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).get(`/status/v1/webhook/${webhook.id}/test/monitored-service-down`);

      expect(res.status).toBe(401);
    });
  });
});
