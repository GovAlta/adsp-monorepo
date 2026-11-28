import { adspId } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createRotationRouter, RotationRouterProps } from './router';

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
const now = new Date('2026-06-01T00:00:00Z');
const future = new Date('2026-09-01T00:00:00Z');
const overlap = new Date('2026-06-08T00:00:00Z');

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
  state: { expiry: future },
  ...overrides,
});

describe('rotation router', () => {
  const keycloak = {
    getClient: jest.fn(),
    listClients: jest.fn(),
    setOptIn: jest.fn(),
    setAttributes: jest.fn(),
    regenerateSecret: jest.fn(),
    invalidatePreviousSecret: jest.fn(),
    countRealmAdminContacts: jest.fn(),
    searchUsers: jest.fn(),
    listRealmAdmins: jest.fn(),
    ensurePolicy: jest.fn(),
    isPolicyEnabled: jest.fn(),
    getPolicySchedule: jest.fn(),
  };
  const createKeycloak = jest.fn();
  const settingsStore = { get: jest.fn(), update: jest.fn() };
  const eventService = { send: jest.fn() };
  const getConfiguration = jest.fn();
  const subscriptions = { sync: jest.fn() };

  const createApp = (user: unknown, tenant?: unknown) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = user as never;
      req.tenant = tenant as never;
      next();
    });
    app.use(
      createRotationRouter({
        logger,
        createKeycloak,
        settingsStore,
        eventService,
        getConfiguration,
        subscriptions,
        links: {
          portalUrl: 'https://portal.test/admin/access',
          runbookUrl: 'https://runbook.test',
          keycloakUrl: 'https://kc.test/auth',
        },
        skipClientIds: ['job'],
        now: () => now,
      } as unknown as RotationRouterProps),
    );
    app.use(createErrorHandler(logger as never));
    return app;
  };

  const admin = {
    id: 'u',
    name: 'admin',
    roles: ['client-secret-admin'],
    isCore: false,
    tenantId,
    token: { bearer: 'user-token' },
  };
  const coreAdmin = { ...admin, id: 'c', name: 'core', isCore: true };
  const tenant = { id: tenantId, name: 'test', realm: 'test' };

  beforeEach(() => {
    jest.resetAllMocks();
    getConfiguration.mockResolvedValue(config);
    settingsStore.get.mockResolvedValue({ realmMode: 'selected' });
    createKeycloak.mockReturnValue(keycloak);
    keycloak.countRealmAdminContacts.mockResolvedValue(1);
    keycloak.isPolicyEnabled.mockResolvedValue(true);
    keycloak.getClient.mockResolvedValue(client());
    keycloak.listClients.mockResolvedValue([client()]);
    keycloak.listRealmAdmins.mockResolvedValue([{ id: 'a1', email: 'admin@example.com', name: 'Ad Min' }]);
    subscriptions.sync.mockResolvedValue(undefined);
  });

  const flush = () => new Promise((resolve) => setImmediate(resolve));

  describe('access', () => {
    it('rejects users without the role', async () => {
      await request(createApp({ ...admin, roles: [] }, tenant))
        .get('/realm')
        .expect(403);
      expect(keycloak.listClients).not.toHaveBeenCalled();
    });

    it('allows a tenant-admin of the realm without the rotation role', async () => {
      await request(createApp({ ...admin, roles: ['urn:ads:platform:tenant-service:tenant-admin'] }, tenant))
        .get('/clients')
        .expect(200);
      expect(keycloak.listClients).toHaveBeenCalled();
    });

    it('acts on the realm of the tenant admin with the admin token, ignoring a realm query', async () => {
      await request(createApp(admin, tenant)).get('/clients?realm=other').expect(200);
      expect(createKeycloak).toHaveBeenCalledWith('test', 'user-token');
      expect(keycloak.listClients).toHaveBeenCalledWith('test', ['job']);
    });

    it('rejects a request without a bearer token', async () => {
      await request(createApp({ ...admin, token: undefined }, tenant))
        .get('/clients')
        .expect(403);
      expect(createKeycloak).not.toHaveBeenCalled();
    });

    it('rejects core users', async () => {
      await request(createApp(coreAdmin, tenant)).get('/clients').expect(403);
      expect(createKeycloak).not.toHaveBeenCalled();
    });
  });

  describe('GET /clients', () => {
    it('returns status and coverage without any secret', async () => {
      keycloak.listClients.mockResolvedValue([
        client({ state: { expiry: new Date('2026-05-01T00:00:00Z') } }),
        client({ id: 'kc-2', clientId: 'other', optedIn: false }),
      ]);

      const res = await request(createApp(admin, tenant)).get('/clients').expect(200);

      expect(res.body).toEqual([
        expect.objectContaining({ clientId: 'urn:ads:test:client', covered: true, status: 'failed' }),
        expect.objectContaining({ clientId: 'other', covered: false, status: 'ok' }),
      ]);
      expect(JSON.stringify(res.body)).not.toMatch(/secret"/i);
    });
  });

  describe('GET /realm', () => {
    it('reports the expiration periods enforced by the Keycloak executor in seconds', async () => {
      keycloak.getPolicySchedule.mockResolvedValue({ expirationPeriod: 300, rotatedExpirationPeriod: 120 });
      const res = await request(createApp(admin, tenant)).get('/realm').expect(200);
      expect(res.body).toEqual(expect.objectContaining({ expirationPeriod: 300, rotatedExpirationPeriod: 120 }));
    });

    it('falls back to the platform defaults, in seconds, when the realm has no profile', async () => {
      const res = await request(createApp(admin, tenant)).get('/realm').expect(200);
      expect(res.body).toEqual(
        expect.objectContaining({ expirationPeriod: 7776000, rotatedExpirationPeriod: 604800, noticePeriod: 5184000 }),
      );
    });

    it('reports Off when the Keycloak policy is disabled', async () => {
      keycloak.isPolicyEnabled.mockResolvedValue(false);
      const res = await request(createApp(admin, tenant)).get('/realm').expect(200);
      expect(res.body.mode).toBe('off');
    });

    it('reports On when the Keycloak policy is enabled although the saved mode is off', async () => {
      settingsStore.get.mockResolvedValue({ realmMode: 'off' });
      const res = await request(createApp(admin, tenant)).get('/realm').expect(200);
      expect(res.body.mode).toBe('selected');
    });
  });

  describe('PUT /realm', () => {
    it('stores only the mode and notice period in configuration and applies the periods to the policy', async () => {
      const res = await request(createApp(admin, tenant))
        .put('/realm')
        .send({ mode: 'selected', expirationPeriod: 10000000, noticePeriod: 2592000 })
        .expect(200);

      expect(settingsStore.update).toHaveBeenCalledWith(tenantId, { realmMode: 'selected', noticePeriod: 2592000 });
      expect(keycloak.ensurePolicy).toHaveBeenCalledWith('test', 10000000, 604800, 'selected');
      expect(res.body).toEqual(expect.objectContaining({ mode: 'selected', expirationPeriod: 10000000 }));
    });

    it('creates the profile and policy when rotation is turned on for a realm that has none', async () => {
      keycloak.isPolicyEnabled.mockResolvedValue(false);

      const res = await request(createApp(admin, tenant)).put('/realm').send({ mode: 'selected' }).expect(200);

      expect(keycloak.ensurePolicy).toHaveBeenCalledWith('test', 7776000, 604800, 'selected');
      expect(res.body.mode).toBe('selected');
    });

    it('keeps the executor value of the period that is not submitted', async () => {
      keycloak.getPolicySchedule.mockResolvedValue({ expirationPeriod: 10000000, rotatedExpirationPeriod: 600 });

      await request(createApp(admin, tenant)).put('/realm').send({ rotatedExpirationPeriod: 1200 }).expect(200);

      expect(keycloak.ensurePolicy).toHaveBeenCalledWith('test', 10000000, 1200, 'selected');
    });

    it('does not enable a disabled policy when only the schedule is saved', async () => {
      keycloak.isPolicyEnabled.mockResolvedValue(false);
      settingsStore.get.mockResolvedValue({ realmMode: 'selected' });

      await request(createApp(admin, tenant)).put('/realm').send({ expirationPeriod: 10000000 }).expect(200);

      expect(keycloak.ensurePolicy).toHaveBeenCalledWith('test', 10000000, 604800, 'off');
    });

    it('allows a rotated secret expiration of 0', async () => {
      await request(createApp(admin, tenant)).put('/realm').send({ rotatedExpirationPeriod: 0 }).expect(200);
      expect(keycloak.ensurePolicy).toHaveBeenCalledWith('test', 7776000, 0, 'selected');
    });

    it('records who turned rotation on or off', async () => {
      keycloak.isPolicyEnabled.mockResolvedValue(false);
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'selected' }).expect(200);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'client-secret-rotation-realm-enabled',
          context: { realm: 'test' },
          payload: expect.objectContaining({ updatedBy: { id: 'u', name: 'admin' } }),
        }),
      );

      keycloak.isPolicyEnabled.mockResolvedValue(true);
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'off' }).expect(200);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'client-secret-rotation-realm-disabled' }),
      );
    });

    it('records a schedule change only when a period changed', async () => {
      await request(createApp(admin, tenant)).put('/realm').send({ expirationPeriod: 10000000 }).expect(200);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'client-secret-rotation-schedule-updated',
          payload: expect.objectContaining({
            expirationPeriod: 10000000,
            updatedBy: { id: 'u', name: 'admin' },
          }),
        }),
      );

      eventService.send.mockClear();
      await request(createApp(admin, tenant)).put('/realm').send({ expirationPeriod: 7776000 }).expect(200);
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('refuses an unsupported mode', async () => {
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'all' }).expect(400);
      expect(settingsStore.update).not.toHaveBeenCalled();
    });

    it.each([
      [{ mode: 'sometimes' }],
      [{ expirationPeriod: 0 }],
      [{ expirationPeriod: 1.5 }],
      [{ rotatedExpirationPeriod: -1 }],
      [{ noticePeriod: 7776000 }],
      [{ rotatedExpirationPeriod: 7776000 }],
    ])('rejects invalid values %j', async (body) => {
      await request(createApp(admin, tenant)).put('/realm').send(body).expect(400);
      expect(settingsStore.update).not.toHaveBeenCalled();
    });

    it('requires a realm admin with an email to turn rotation on', async () => {
      keycloak.countRealmAdminContacts.mockResolvedValue(0);
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'selected' }).expect(400);
      expect(settingsStore.update).not.toHaveBeenCalled();
    });

    it('allows turning rotation off without contacts', async () => {
      keycloak.countRealmAdminContacts.mockResolvedValue(0);
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'off' }).expect(200);
    });

    it('leaves the stored settings untouched when the policy cannot be changed', async () => {
      keycloak.ensurePolicy.mockRejectedValue(new Error('forbidden'));

      await request(createApp(admin, tenant))
        .put('/realm')
        .send({ mode: 'selected', noticePeriod: 2592000 })
        .expect(500);

      expect(settingsStore.update).not.toHaveBeenCalled();
    });

    const flush = () => new Promise((resolve) => setImmediate(resolve));

    it('clears client expiries in the background when turning rotation off', async () => {
      keycloak.listClients.mockResolvedValue([
        client(),
        client({ id: 'kc-2', clientId: 'b', state: {} }),
        client({ id: 'kc-3', clientId: 'c', state: { rotatedExpiry: overlap } }),
      ]);
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'off' }).expect(200);
      await flush();

      const cleared = { 'client.secret.expiration.time': null, 'client.secret.rotated.expiration.time': null };
      expect(keycloak.listClients).toHaveBeenCalledWith('test', ['job']);
      expect(keycloak.setAttributes).toHaveBeenCalledTimes(2);
      expect(keycloak.setAttributes).toHaveBeenCalledWith('test', 'kc-1', cleared);
      expect(keycloak.setAttributes).toHaveBeenCalledWith('test', 'kc-3', cleared);
    });

    it('still saves when clearing one client fails', async () => {
      keycloak.setAttributes.mockRejectedValue(new Error('boom'));
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'off' }).expect(200);
      await flush();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('still saves when listing the clients to clear fails', async () => {
      keycloak.listClients.mockRejectedValue(new Error('boom'));
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'off' }).expect(200);
      await flush();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('does not clear expiries for other modes', async () => {
      await request(createApp(admin, tenant)).put('/realm').send({ mode: 'selected' }).expect(200);
      expect(keycloak.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('PUT /clients/:clientId/opt-in', () => {
    it('opts a client in', async () => {
      await request(createApp(admin, tenant))
        .put(`/clients/${encodeURIComponent('urn:ads:test:client')}/opt-in`)
        .send({ enabled: true })
        .expect(200);
      expect(keycloak.setOptIn).toHaveBeenCalledWith('test', 'urn:ads:test:client', true);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'client-secret-rotation-enabled',
          context: { realm: 'test', clientId: 'urn:ads:test:client' },
          payload: expect.objectContaining({ updatedBy: { id: 'u', name: 'admin' } }),
        }),
      );
    });

    it('notifies when a client is opted out', async () => {
      await request(createApp(admin, tenant))
        .put(`/clients/${encodeURIComponent('urn:ads:test:client')}/opt-in`)
        .send({ enabled: false })
        .expect(200);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'client-secret-rotation-disabled' }),
      );
    });

    it('removes the expiry of a client when it is opted out', async () => {
      await request(createApp(admin, tenant))
        .put(`/clients/${encodeURIComponent('urn:ads:test:client')}/opt-in`)
        .send({ enabled: false })
        .expect(200);
      expect(keycloak.setOptIn).toHaveBeenCalledWith('test', 'urn:ads:test:client', false);
      expect(keycloak.setAttributes).toHaveBeenCalledWith('test', 'kc-1', {
        'client.secret.expiration.time': null,
        'client.secret.rotated.expiration.time': null,
      });
    });

    it('is refused while rotation is off', async () => {
      settingsStore.get.mockResolvedValue({ realmMode: 'off' });
      keycloak.isPolicyEnabled.mockResolvedValue(false);
      await request(createApp(admin, tenant)).put('/clients/c/opt-in').send({ enabled: true }).expect(400);
      expect(keycloak.setOptIn).not.toHaveBeenCalled();
    });

    it('needs realm admin contacts to opt in', async () => {
      keycloak.countRealmAdminContacts.mockResolvedValue(0);
      await request(createApp(admin, tenant)).put('/clients/c/opt-in').send({ enabled: true }).expect(400);
    });

    it('hides the rotation service client', async () => {
      keycloak.getClient.mockResolvedValue(client({ clientId: 'job' }));
      await request(createApp(admin, tenant)).put('/clients/job/opt-in').send({ enabled: true }).expect(404);
    });
  });

  describe('GET /users', () => {
    it('searches the realm users', async () => {
      const users = [{ id: 'u1', username: 'jo', name: 'Jo Smith', email: 'jo@example.com' }];
      keycloak.searchUsers.mockResolvedValue(users);

      const res = await request(createApp(admin, tenant)).get('/users').query({ search: ' joe ' }).expect(200);

      expect(res.body).toEqual(users);
      expect(keycloak.searchUsers).toHaveBeenCalledWith('test', 'joe', 10);
    });

    it('rejects a search that is too short', async () => {
      await request(createApp(admin, tenant)).get('/users').query({ search: 'jo' }).expect(400);
      expect(keycloak.searchUsers).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /clients/:clientId', () => {
    it('stores contacts', async () => {
      await request(createApp(admin, tenant))
        .patch('/clients/c')
        .send({ contacts: ['a@example.com', ' b@example.com '] })
        .expect(200);
      expect(keycloak.setAttributes).toHaveBeenCalledWith('test', 'kc-1', {
        'rotation-contact': 'a@example.com,b@example.com',
      });
    });

    it('records who changed the contacts without the addresses', async () => {
      await request(createApp(admin, tenant))
        .patch('/clients/c')
        .send({ contacts: ['a@example.com', 'b@example.com'] })
        .expect(200);
      const event = eventService.send.mock.calls
        .map(([e]) => e)
        .find((e) => e.name === 'client-secret-rotation-contacts-updated');
      expect(event).toMatchObject({
        context: { realm: 'test' },
        payload: {
          realm: 'test',
          clientId: 'urn:ads:test:client',
          contactCount: 2,
          updatedBy: { id: 'u', name: 'admin' },
        },
      });
      expect(JSON.stringify(event)).not.toContain('a@example.com');
    });

    it('syncs notification subscriptions with the admin token', async () => {
      keycloak.listClients.mockResolvedValue([
        client({ clientId: 'c', contacts: ['a@example.com'] }),
        client({ clientId: 'x', contacts: [] }),
      ]);
      await request(createApp(admin, tenant))
        .patch('/clients/c')
        .send({ contacts: ['a@example.com'] })
        .expect(200);
      await flush();
      expect(subscriptions.sync).toHaveBeenCalledWith(
        tenantId,
        {
          realm: 'test',
          admins: [{ email: 'admin@example.com', name: 'Ad Min' }],
          clients: [{ clientId: 'c', contacts: ['a@example.com'] }],
        },
        'user-token',
      );
    });

    it('does not fail the request when the sync fails', async () => {
      subscriptions.sync.mockRejectedValue(new Error('down'));
      await request(createApp(admin, tenant))
        .patch('/clients/c')
        .send({ contacts: ['a@example.com'] })
        .expect(200);
      await flush();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('clears contacts', async () => {
      await request(createApp(admin, tenant)).patch('/clients/c').send({ contacts: [] }).expect(200);
      expect(keycloak.setAttributes).toHaveBeenCalledWith('test', 'kc-1', { 'rotation-contact': null });
    });

    it('rejects bad email addresses', async () => {
      await request(createApp(admin, tenant))
        .patch('/clients/c')
        .send({ contacts: ['nope'] })
        .expect(400);
      expect(keycloak.setAttributes).not.toHaveBeenCalled();
    });
  });

  describe('POST rotate', () => {
    it('rotates a covered client and raises the event without a secret', async () => {
      keycloak.getClient
        .mockResolvedValueOnce(client())
        .mockResolvedValueOnce(client({ state: { expiry: future, rotatedExpiry: overlap } }))
        .mockResolvedValueOnce(client({ state: { expiry: future, rotatedExpiry: overlap } }));

      const res = await request(createApp(admin, tenant)).post('/clients/c/rotate').expect(200);

      expect(keycloak.regenerateSecret).toHaveBeenCalledWith('test', 'kc-1');
      expect(res.body).toEqual(
        expect.objectContaining({ expiresAt: future.toISOString(), rotatedSecretExpiresAt: overlap.toISOString() }),
      );
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          name: 'client-secret-rotated',
          payload: expect.objectContaining({
            clientId: 'urn:ads:test:client',
            portalUrl: 'https://portal.test/admin/access',
            runbookUrl: 'https://runbook.test',
            keycloakUrl: 'https://kc.test/auth/admin/test/console/#/test/clients/kc-1/credentials',
          }),
        }),
      );
    });

    it('refuses a client that is not covered', async () => {
      keycloak.getClient.mockResolvedValue(client({ optedIn: false }));
      await request(createApp(admin, tenant)).post('/clients/c/rotate').expect(400);
      expect(keycloak.regenerateSecret).not.toHaveBeenCalled();
    });

    it('still succeeds when the event cannot be sent after the secret changed', async () => {
      keycloak.getClient
        .mockResolvedValueOnce(client())
        .mockResolvedValueOnce(client({ state: { expiry: future, rotatedExpiry: overlap } }));
      eventService.send.mockRejectedValue(new Error('event service down'));

      await request(createApp(admin, tenant)).post('/clients/c/rotate').expect(200);

      expect(keycloak.regenerateSecret).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST invalidate-previous', () => {
    it('invalidates a live previous secret and raises the revoked event', async () => {
      keycloak.getClient.mockResolvedValue(client({ state: { expiry: future, rotatedExpiry: overlap } }));

      await request(createApp(admin, tenant)).post('/clients/c/invalidate-previous').expect(200);

      expect(keycloak.invalidatePreviousSecret).toHaveBeenCalledWith('test', 'kc-1');
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'client-secret-revoked',
          payload: expect.objectContaining({ revokedAt: now.toISOString() }),
        }),
      );
    });

    it('refuses when there is no previous secret', async () => {
      await request(createApp(admin, tenant)).post('/clients/c/invalidate-previous').expect(400);
      expect(keycloak.invalidatePreviousSecret).not.toHaveBeenCalled();
    });

    it('refuses when the previous secret already expired', async () => {
      keycloak.getClient.mockResolvedValue(
        client({ state: { expiry: future, rotatedExpiry: new Date('2026-05-01T00:00:00Z') } }),
      );
      await request(createApp(admin, tenant)).post('/clients/c/invalidate-previous').expect(400);
    });
  });

  describe('POST notify', () => {
    it('raises the due event and records the notice', async () => {
      await request(createApp(admin, tenant)).post('/clients/c/notify').expect(200);

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'client-secret-rotation-due',
          payload: expect.objectContaining({ expiry: future.toISOString(), daysRemaining: 92 }),
        }),
      );
      expect(keycloak.setAttributes).toHaveBeenCalledWith('test', 'kc-1', {
        'rotation-notice-sent-for': future.toISOString(),
        'rotation-notice-sent-at': now.toISOString(),
      });
    });

    it('refuses a client without an expiry', async () => {
      keycloak.getClient.mockResolvedValue(client({ state: {} }));
      await request(createApp(admin, tenant)).post('/clients/c/notify').expect(400);
    });
  });
});
