import { adspId } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { createRotationRouter, RotationRouterProps } from './router';

// Verifies the statuses and response shapes documented in router.swagger.yml by sending requests through the
// rotation router as mounted in the service, with the real error handler.
describe('rotation router documented behaviour', () => {
  const documented = createDocumentedResponseRecorder(join(__dirname, 'router.swagger.yml'));
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const tenant = { id: tenantId, name: 'test', realm: 'test' };
  const admin = {
    id: 'u',
    name: 'admin',
    roles: ['client-secret-admin'],
    isCore: false,
    tenantId,
    token: { bearer: 'user-token' },
  };
  const now = new Date('2026-06-01T00:00:00Z');

  const config = {
    enabled: true,
    expiryDays: 90,
    noticeWindowDays: 60,
    rotatedSecretOverlapDays: 7,
    minNoticeGapDays: 7,
    coreContacts: [],
    coreNotificationTenantId: 'urn:ads:platform:tenant-service:v2:/tenants/ops',
    coreRealmMode: 'off',
  };
  const client = (overrides = {}) => ({
    id: 'kc-1',
    clientId: 'urn:ads:test:client',
    name: 'Test',
    optedIn: true,
    contacts: ['a@example.com'],
    state: { expiry: new Date('2026-09-01T00:00:00Z') },
    ...overrides,
  });

  const keycloak = {
    getClient: jest.fn(),
    listClients: jest.fn(),
    setOptIn: jest.fn(),
    setAttributes: jest.fn(),
    regenerateSecret: jest.fn(),
    invalidatePreviousSecret: jest.fn(),
    countRealmAdminContacts: jest.fn(),
    ensurePolicy: jest.fn(),
    isPolicyEnabled: jest.fn().mockResolvedValue(true),
    getPolicySchedule: jest.fn(),
  };
  const settingsStore = { get: jest.fn(), update: jest.fn() };

  function createApp(user: unknown = admin) {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = user as never;
      req.tenant = tenant as never;
      next();
    });
    app.use(
      '/rotation/v1',
      createRotationRouter({
        logger,
        createKeycloak: () => keycloak,
        settingsStore,
        eventService: { send: jest.fn() },
        getConfiguration: jest.fn().mockResolvedValue(config),
        skipClientIds: [],
        now: () => now,
      } as unknown as RotationRouterProps),
    );
    app.use(createErrorHandler(logger as never));
    return app;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    settingsStore.get.mockResolvedValue({ realmMode: 'selected' });
    settingsStore.update.mockResolvedValue(undefined);
    keycloak.countRealmAdminContacts.mockResolvedValue(1);
    keycloak.isPolicyEnabled.mockResolvedValue(true);
    keycloak.getClient.mockResolvedValue(client());
    keycloak.listClients.mockResolvedValue([client()]);
    keycloak.regenerateSecret.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  it('GET /realm returns the settings, or 403 without the role', async () => {
    await request(createApp()).get('/rotation/v1/realm').expect(200);
    await request(createApp({ ...admin, roles: [] }))
      .get('/rotation/v1/realm')
      .expect(403);
  });

  it('PUT /realm saves the mode, or 400 for an invalid mode', async () => {
    await request(createApp()).put('/rotation/v1/realm').send({ mode: 'selected' }).expect(200);
    await request(createApp()).put('/rotation/v1/realm').send({ mode: 'bogus' }).expect(400);
  });

  it('GET /clients lists the clients, or 403 for a core user', async () => {
    await request(createApp()).get('/rotation/v1/clients').expect(200);
    await request(createApp({ ...admin, isCore: true }))
      .get('/rotation/v1/clients')
      .expect(403);
  });

  it('PATCH /clients/{clientId} sets the contacts, or 400 for an invalid email', async () => {
    const path = '/rotation/v1/clients/urn%3Aads%3Atest%3Aclient';
    await request(createApp())
      .patch(path)
      .send({ contacts: ['b@example.com'] })
      .expect(200);
    await request(createApp())
      .patch(path)
      .send({ contacts: ['not-an-email'] })
      .expect(400);
  });

  it('PUT /clients/{clientId}/opt-in opts in, or 404 for an unknown client', async () => {
    const path = '/rotation/v1/clients/urn%3Aads%3Atest%3Aclient/opt-in';
    await request(createApp()).put(path).send({ enabled: true }).expect(200);
    keycloak.getClient.mockResolvedValueOnce(null);
    await request(createApp()).put(path).send({ enabled: true }).expect(404);
  });

  it('POST /clients/{clientId}/rotate rotates, or 400 when the client is not covered', async () => {
    const path = '/rotation/v1/clients/urn%3Aads%3Atest%3Aclient/rotate';
    await request(createApp()).post(path).expect(200);
    keycloak.getClient.mockResolvedValueOnce(client({ optedIn: false }));
    await request(createApp()).post(path).expect(400);
  });

  it('POST /clients/{clientId}/invalidate-previous invalidates, or 400 without a previous secret', async () => {
    const path = '/rotation/v1/clients/urn%3Aads%3Atest%3Aclient/invalidate-previous';
    keycloak.getClient.mockResolvedValueOnce(
      client({ state: { expiry: new Date('2026-09-01T00:00:00Z'), rotatedExpiry: new Date('2026-06-08T00:00:00Z') } }),
    );
    await request(createApp()).post(path).expect(200);
    await request(createApp()).post(path).expect(400);
  });

  it('POST /clients/{clientId}/notify notifies, or 400 without an expiry', async () => {
    const path = '/rotation/v1/clients/urn%3Aads%3Atest%3Aclient/notify';
    await request(createApp()).post(path).expect(200);
    keycloak.getClient.mockResolvedValueOnce(client({ state: {} }));
    await request(createApp()).post(path).expect(400);
  });
});
