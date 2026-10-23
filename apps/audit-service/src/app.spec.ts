jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  initializePlatform: jest.fn(),
  instrumentAxios: jest.fn(),
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFile: jest.fn((_path, _options, callback) => callback(null, '{}')),
}));
jest.mock('./postgres', () => ({
  ...jest.requireActual('./postgres'),
  createDatabase: jest.fn().mockImplementation(async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    return {
      knex: { destroy },
      isConnected: jest.fn().mockResolvedValue(true),
      close: destroy,
    };
  }),
}));
jest.mock('./environments/environment', () => ({
  environment: {
    CLIENT_ID: 'urn:ads:platform:audit-service',
    CLIENT_SECRET: 'test-only',
    KEYCLOAK_ROOT_URL: 'https://access.example.test',
    DIRECTORY_URL: 'https://directory.example.test',
    LOG_LEVEL: 'error',
    TRUSTED_PROXY: false,
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.example.test:4318',
    RETENTION_MIN_DAYS: 1,
    RETENTION_MAX_DAYS: 3650,
    RETENTION_ENABLED: false,
    RETENTION_BATCH_SIZE: 1000,
    RETENTION_MAX_BATCHES: 10,
    RETENTION_SCHEDULE: '0 2 * * *',
  },
}));
jest.mock('./audit/jobs/retention', () => ({
  ...jest.requireActual('./audit/jobs/retention'),
  scheduleRetentionJob: jest.fn(),
}));

import { adspId, ConfigurationService, initializePlatform, User } from '@abgov/adsp-service-sdk';
import { generateKeyPairSync } from 'crypto';
import { sign, SignOptions } from 'jsonwebtoken';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { AuditApplication, initializeApp } from './app';
import { AuditServiceRoles } from './audit';
import { createDatabase, PostgresEventRepository, PostgresFailedEventRepository } from './postgres';
import { AuditStorageUnavailableError, AuditStoreError } from './audit/buffer';
import { randomUUID } from 'crypto';
import { scheduleRetentionJob } from './audit/jobs/retention';
import { environment } from './environments/environment';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { PROCESS_SHUTDOWN_TIMEOUT_MS, TRAFFIC_WITHDRAWAL_MS } from './shutdown';
import { MAX_BUFFERED_BYTES, SHUTDOWN_TIMEOUT_MS } from './audit/buffer/write-buffer';
import { HISTORY_QUERY_TIMEOUT_MS, STATEMENT_TIMEOUT_MS } from './postgres/operation';
import { HEALTH_CHECK_TIMEOUT_MS } from './postgres/health';

describe('audit application authorization', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const serviceId = adspId`urn:ads:platform:audit-service`;
  const tenantA = {
    id: adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`,
    name: 'Case',
    realm: 'case-team',
  };
  const tenantB = {
    id: adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`,
    name: 'Payment',
    realm: 'payment-team',
  };
  const tenantService = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const wrongKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  let app: AuditApplication;

  function createStrategy(realm: string, isCore: boolean) {
    return new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: publicKey,
        algorithms: ['RS256'],
        audience: serviceId.toString(),
        issuer: `https://access.example.test/auth/realms/${realm}`,
      },
      (payload, done) => {
        const user: User = {
          id: payload.sub,
          name: payload.preferred_username,
          email: '',
          isCore,
          tenantId: isCore ? undefined : tenantA.id,
          roles: payload.resource_access?.[serviceId.toString()]?.roles || [],
          token: { ...payload, bearer: 'verified-by-passport' },
        };
        done(null, user);
      },
    );
  }

  function token(roles: string[], realm = tenantA.realm, options: SignOptions = {}) {
    return sign(
      {
        azp: 'urn:ads:case-team:case-service',
        preferred_username: 'audit-client',
        resource_access: { [serviceId.toString()]: { roles } },
      },
      privateKey,
      {
        algorithm: 'RS256',
        subject: 'audit-client',
        audience: serviceId.toString(),
        issuer: `https://access.example.test/auth/realms/${realm}`,
        expiresIn: '5m',
        ...options,
      },
    );
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(PostgresEventRepository.prototype, 'insert')
      .mockImplementation(async (events) => events.map(({ id }) => id));
    jest.spyOn(PostgresEventRepository.prototype, 'park').mockResolvedValue(undefined);
    jest.spyOn(PostgresEventRepository.prototype, 'find').mockResolvedValue([]);
    jest.spyOn(PostgresEventRepository.prototype, 'get').mockResolvedValue(null);
    jest.spyOn(PostgresFailedEventRepository.prototype, 'list').mockResolvedValue([]);
    jest.spyOn(PostgresFailedEventRepository.prototype, 'countOpen').mockResolvedValue(0);
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'case-service',
      actions: {},
    });
    jest.mocked(initializePlatform).mockResolvedValue({
      coreStrategy: createStrategy('core', true),
      tenantStrategy: createStrategy(tenantA.realm, false),
      tenantHandler: (req, _res, next) => {
        const tenantId = req.user.isCore ? req.query.tenantId : req.user.tenantId?.toString();
        if (tenantId) req.tenant = tenantId === tenantA.id.toString() ? tenantA : tenantB;
        next();
      },
      tenantService,
      configurationService: configuration,
      directory: { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() },
      eventService: { send: jest.fn() },
      tokenProvider: { getAccessToken: jest.fn() },
      configurationHandler: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue({}),
      clearCached: jest.fn(),
      metricsHandler: (_req, _res, next) => next(),
      traceHandler: (_req, _res, next) => next(),
      shutdownTelemetry: jest.fn(),
      logger,
    });

    app = await initializeApp();
  });

  afterEach(async () => {
    await app.shutdown();
    jest.restoreAllMocks();
  });

  it('registers all three roles with only the reader included in tenant-admin', () => {
    const registration = jest.mocked(initializePlatform).mock.calls[0][0];

    expect({ serviceId: registration.serviceId.toString(), roles: registration.roles }).toEqual({
      serviceId: serviceId.toString(),
      roles: [
        { role: AuditServiceRoles.Reader, description: expect.any(String), inTenantAdmin: true },
        { role: AuditServiceRoles.Writer, description: expect.any(String) },
        { role: AuditServiceRoles.Admin, description: expect.any(String) },
      ],
    });
  });

  it('passes the configured OTLP endpoint to the SDK metrics exporter', () => {
    const registration = jest.mocked(initializePlatform).mock.calls[0][0];

    expect(registration.metrics).toBe('http://collector.example.test:4318');
  });

  it('does not schedule retention when explicitly disabled', () => {
    expect(scheduleRetentionJob).not.toHaveBeenCalled();
  });

  it('starts enabled retention and drains it before closing database connections', async () => {
    await app.shutdown();
    jest.replaceProperty(environment, 'RETENTION_ENABLED', true);
    jest.replaceProperty(environment, 'RETENTION_BATCH_SIZE', 100);
    jest.replaceProperty(environment, 'RETENTION_MAX_BATCHES', 3);
    jest.replaceProperty(environment, 'RETENTION_SCHEDULE', '0 2 * * *');
    const stop = jest.fn().mockResolvedValue(undefined);
    jest.mocked(scheduleRetentionJob).mockReturnValue({ stop });
    app = await initializeApp();
    const { knex } = await jest.mocked(createDatabase).mock.results.at(-1).value;
    jest.mocked(knex.destroy).mockClear();

    await app.shutdown();

    expect(scheduleRetentionJob).toHaveBeenCalledWith(expect.anything(), '0 2 * * *', expect.anything());
    expect(stop.mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(knex.destroy).mock.invocationCallOrder[0]);
  });

  it('registers the service replay action catalog through the SDK', () => {
    const registration = jest.mocked(initializePlatform).mock.calls[0][0];

    const [{ configuration: registered }] = registration.serviceConfigurations;
    expect(registered).toHaveLength(1);
    expect(registered[0]).toMatchObject({
      name: 'actions-audit-service',
      operation: 'REPLACE',
      configuration: { kind: 'actionCatalog', application: 'audit-service' },
    });
    const { actions } = registered[0].configuration as { actions: Record<string, unknown> };
    expect(Object.keys(actions).sort()).toEqual(
      [
        'events.list',
        'events.list-all',
        'events.read',
        'failed-event.replay',
        'failed-events.list',
        'retention.run',
      ].sort(),
    );
    expect(actions['failed-event.replay']).toEqual({
      version: 1,
      category: 'administrative',
      severity: 'info',
      retentionClass: 'compliance',
      resourceType: 'failed-event',
      captureChangeSet: false,
      forwardToSiem: false,
    });
    expect(registration.serviceConfigurations[0].serviceId.toString()).toBe(serviceId.toString());
  });

  it.each([
    { method: 'get' as const, path: '/audit/v1/failed-events' },
    { method: 'post' as const, path: '/audit/v1/failed-events/54862935-e55b-4bc4-8cd0-9e64b193bbd2/replay' },
  ])('returns 503 for authorized $method $path when storage fails', async ({ method, path }) => {
    jest
      .spyOn(PostgresFailedEventRepository.prototype, 'list')
      .mockRejectedValue(new AuditStorageUnavailableError('Database unavailable'));
    jest
      .spyOn(PostgresFailedEventRepository.prototype, 'withReplayTransaction')
      .mockRejectedValue(new AuditStorageUnavailableError('Database unavailable'));
    await request(app)
      [method](path)
      .auth(token([AuditServiceRoles.Admin]), { type: 'bearer' })
      .expect('Retry-After', '1')
      .expect(503);
  });

  it('uses PostgreSQL for the administrator failed-event list', async () => {
    const response = await request(app)
      .get('/audit/v1/failed-events')
      .auth(token([AuditServiceRoles.Admin]), { type: 'bearer' })
      .expect(200);

    expect(PostgresFailedEventRepository.prototype.list).toHaveBeenCalledWith(tenantA.id.toString(), 20, undefined);
    expect(response.body).toEqual({ results: [], page: { size: 0 } });
  });

  it('uses a PostgreSQL transaction for replay rather than returning unconfigured storage', async () => {
    jest
      .spyOn(PostgresFailedEventRepository.prototype, 'withReplayTransaction')
      .mockImplementation(async (_tenantId, work) =>
        work({
          getForUpdate: jest.fn().mockResolvedValue(null),
          insertReplayedEvent: jest.fn(),
          markReplayed: jest.fn(),
          insertReplayAudit: jest.fn(),
        }),
      );

    await request(app)
      .post('/audit/v1/failed-events/54862935-e55b-4bc4-8cd0-9e64b193bbd2/replay')
      .auth(token([AuditServiceRoles.Admin]), { type: 'bearer' })
      .expect(404);

    expect(PostgresFailedEventRepository.prototype.withReplayTransaction).toHaveBeenCalledWith(
      tenantA.id.toString(),
      expect.any(Function),
    );
  });

  describe.each([
    { method: 'get' as const, path: '/audit/v1/case-service/actions', role: AuditServiceRoles.Reader },
    { method: 'post' as const, path: '/audit/v1/case-service/events', role: AuditServiceRoles.Writer },
    { method: 'get' as const, path: '/audit/v1/failed-events', role: AuditServiceRoles.Admin },
    {
      method: 'post' as const,
      path: '/audit/v1/failed-events/54862935-e55b-4bc4-8cd0-9e64b193bbd2/replay',
      role: AuditServiceRoles.Admin,
    },
    { method: 'get' as const, path: '/audit/v1/events', role: AuditServiceRoles.Reader },
    { method: 'get' as const, path: '/audit/v1/case-service/events', role: AuditServiceRoles.Reader },
    {
      method: 'get' as const,
      path: '/audit/v1/case-service/events/54603ec0-b54a-4ebf-a283-87bc0f47dfed',
      role: AuditServiceRoles.Reader,
    },
  ])('$method $path', ({ method, path, role }) => {
    it('returns 401 for a missing token', async () => {
      const response = await request(app)[method](path);

      expect(response.status).toBe(401);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });

    it.each([
      ['malformed', () => 'invalid-token'],
      ['expired', () => token([role], tenantA.realm, { expiresIn: -1 })],
      ['wrong audience', () => token([role], tenantA.realm, { audience: 'urn:ads:platform:file-service' })],
      ['unknown issuer', () => token([role], 'unknown-realm')],
      [
        'invalid signature',
        () =>
          sign({}, wrongKey, {
            algorithm: 'RS256',
            audience: serviceId.toString(),
            issuer: 'https://access.example.test/auth/realms/core',
          }),
      ],
    ])('returns 401 for a %s token', async (_label, createToken) => {
      const response = await request(app)[method](path).auth(createToken(), { type: 'bearer' });

      expect(response.status).toBe(401);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });

    it.each([tenantA.realm, 'core'])('returns 403 without the role for %s', async (realm) => {
      const response = await request(app)
        [method](path)
        .auth(token([], realm), { type: 'bearer' })
        .query({ tenantId: tenantA.id.toString() });

      expect(response.status).toBe(403);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });

    it('refuses a tenant token targeting another tenant despite holding the role', async () => {
      const response = await request(app)
        [method](path)
        .auth(token([role]), { type: 'bearer' })
        .query({ tenantId: tenantB.id.toString() });

      expect(response.status).toBe(403);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });
  });

  it('accepts a tenant reader token and resolves its tenant', async () => {
    await request(app)
      .get('/audit/v1/case-service/actions')
      .auth(token([AuditServiceRoles.Reader]), { type: 'bearer' })
      .expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantA.id);
  });

  it('accepts a Core reader for an explicitly selected tenant', async () => {
    await request(app)
      .get('/audit/v1/case-service/actions')
      .auth(token([AuditServiceRoles.Reader], 'core'), { type: 'bearer' })
      .query({ tenantId: tenantB.id.toString() })
      .expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantB.id);
  });

  it('preserves Core-only catalog access without tenant context', async () => {
    await request(app)
      .get('/audit/v1/case-service/actions')
      .auth(token([AuditServiceRoles.Reader], 'core'), { type: 'bearer' })
      .expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', undefined);
  });

  it.each(['/', '/health', '/swagger/docs/v1'])('keeps infrastructure endpoint %s public', async (path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(200);
  });

  function eventInput() {
    return {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      action: 'case.update',
      status: 'success',
      actor: { id: 'case-worker', type: 'user' },
    };
  }

  function configureAction() {
    configuration.getServiceConfiguration
      .mockResolvedValueOnce({
        kind: 'actionCatalog',
        application: 'case-service',
        actions: {
          'case.update': { version: 1, category: 'administrative', severity: 'info', retentionClass: 'standard' },
        },
      })
      .mockResolvedValue(null);
  }

  it('writes validated events through the runtime buffer and PostgreSQL adapter', async () => {
    configureAction();
    const input = eventInput();

    const response = await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [input] });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ accepted: 1, duplicates: 0, rejected: [] });
    expect(PostgresEventRepository.prototype.insert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          tenant_id: tenantA.id.toString(),
          namespace: 'case-service',
          event_id: input.eventId,
        }),
      ],
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('counts database conflicts as duplicates rather than accepted events', async () => {
    configureAction();
    jest.mocked(PostgresEventRepository.prototype.insert).mockResolvedValue([]);

    const response = await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [eventInput()] });

    expect(response.body).toEqual({ accepted: 0, duplicates: 1, rejected: [] });
  });

  it('reads stored history with the API shape after its action catalog is removed', async () => {
    configureAction();
    const input = eventInput();
    await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [input] })
      .expect(202);
    const stored = jest.mocked(PostgresEventRepository.prototype.insert).mock.calls[0][0][0];
    jest.mocked(PostgresEventRepository.prototype.get).mockResolvedValue(stored);
    configuration.getServiceConfiguration.mockClear().mockResolvedValue(null);

    const response = await request(app)
      .get(`/audit/v1/case-service/events/${stored.id}`)
      .auth(token([AuditServiceRoles.Reader]), { type: 'bearer' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: stored.id,
      eventId: input.eventId,
      namespace: 'case-service',
      action: input.action,
      occurredAt: input.occurredAt,
      actor: input.actor,
      retentionClass: 'standard',
    });
    expect(response.body).not.toHaveProperty('tenant_id');
    expect(configuration.getServiceConfiguration).not.toHaveBeenCalledWith(
      expect.stringMatching(/^actions-(?!audit-service$)/),
      expect.anything(),
    );
  });

  it('durably parks storage failures before returning a per-event rejection', async () => {
    configureAction();
    const input = eventInput();
    jest
      .mocked(PostgresEventRepository.prototype.insert)
      .mockRejectedValue(new AuditStoreError('Write failed', 'permanent'));

    const response = await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [input] });

    expect(response.status).toBe(202);
    expect(response.body.rejected).toEqual([expect.objectContaining({ index: 0, code: 'storage_failed' })]);
    expect(PostgresEventRepository.prototype.park).toHaveBeenCalledWith(
      [expect.objectContaining({ event: input, tenant_id: tenantA.id.toString() })],
      expect.anything(),
    );
  });

  it.each(['/audit/v1/events', '/audit/v1/case-service/events'])(
    'connects %s to database reads without loading catalogs',
    async (path) => {
      const response = await request(app)
        .get(path)
        .auth(token([AuditServiceRoles.Reader]), { type: 'bearer' });

      expect(response.status).toBe(200);
      expect(PostgresEventRepository.prototype.find).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: tenantA.id.toString() }),
        10,
        undefined,
      );
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalledWith(
        expect.stringMatching(/^actions-(?!audit-service$)/),
        expect.anything(),
      );
    },
  );

  it('connects event details to tenant-scoped database reads', async () => {
    const id = randomUUID();

    await request(app)
      .get(`/audit/v1/case-service/events/${id}`)
      .auth(token([AuditServiceRoles.Reader]), { type: 'bearer' })
      .expect(404);

    expect(PostgresEventRepository.prototype.get).toHaveBeenCalledWith(tenantA.id.toString(), 'case-service', id);
  });

  it('scopes Core history queries to the explicitly selected tenant', async () => {
    await request(app)
      .get('/audit/v1/events')
      .auth(token([AuditServiceRoles.Reader], 'core'), { type: 'bearer' })
      .query({ tenantId: tenantB.id.toString() })
      .expect(200);

    expect(PostgresEventRepository.prototype.find).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: tenantB.id.toString() }),
      10,
      undefined,
    );
  });

  it('returns a retryable failure if neither audit nor failed-event storage succeeds', async () => {
    configureAction();
    jest
      .mocked(PostgresEventRepository.prototype.insert)
      .mockRejectedValue(new AuditStoreError('Write failed', 'permanent'));
    jest
      .mocked(PostgresEventRepository.prototype.park)
      .mockRejectedValue(new AuditStoreError('Parking failed', 'permanent'));

    const response = await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [eventInput()] });

    expect(response.status).toBe(503);
    expect(response.headers['retry-after']).toBe('1');
  });

  it('reports unavailable readiness when the database is disconnected', async () => {
    const database = await jest.mocked(createDatabase).mock.results[0].value;
    database.isConnected.mockResolvedValueOnce(false);

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({ db: false, ready: false });
  });

  it('keeps liveness independent of the database and platform health', async () => {
    const database = await jest.mocked(createDatabase).mock.results[0].value;
    const platform = await jest.mocked(initializePlatform).mock.results[0].value;
    database.isConnected.mockResolvedValue(false);

    const response = await request(app).get('/health/live').expect(200);

    expect(response.text).toBe('');
    expect(database.isConnected).not.toHaveBeenCalled();
    expect(platform.healthCheck).not.toHaveBeenCalled();
  });

  it.each([true, false])('returns only readiness status when database connectivity is %s', async (connected) => {
    const database = await jest.mocked(createDatabase).mock.results[0].value;
    database.isConnected.mockResolvedValue(connected);

    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(connected ? 200 : 503);
    expect(response.text).toBe('');
  });

  it('recovers readiness without a write or restart after an unsuccessful storage operation', async () => {
    configureAction();
    jest
      .mocked(PostgresEventRepository.prototype.insert)
      .mockRejectedValue(new AuditStoreError('Unavailable', 'permanent'));
    jest
      .mocked(PostgresEventRepository.prototype.park)
      .mockRejectedValue(new AuditStoreError('Unavailable', 'permanent'));
    const database = await jest.mocked(createDatabase).mock.results[0].value;
    database.isConnected.mockResolvedValue(false);
    await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [eventInput()] })
      .expect(503);
    await request(app).get('/health/ready').expect(503);

    database.isConnected.mockResolvedValue(true);

    await request(app).get('/health/ready').expect(200);
  });

  it('withdraws readiness while continuing to accept writes before draining', async () => {
    configureAction();
    app.beginShutdown();

    await request(app).get('/health/ready').expect(503);
    await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [eventInput()] })
      .expect(202);

    expect(PostgresEventRepository.prototype.insert).toHaveBeenCalledTimes(1);
  });

  it('does not check the database once shutdown starts', async () => {
    const database = await jest.mocked(createDatabase).mock.results[0].value;
    app.beginShutdown();

    await request(app).get('/health/ready').expect(503);

    expect(database.isConnected).not.toHaveBeenCalled();
  });

  it('keeps liveness healthy during shutdown', async () => {
    await app.drain();

    await request(app).get('/health/live').expect(200);
  });

  it('does not report ready if shutdown begins during a database check', async () => {
    const database = await jest.mocked(createDatabase).mock.results[0].value;
    database.isConnected.mockImplementationOnce(async () => {
      app.beginShutdown();
      return true;
    });

    await request(app).get('/health/ready').expect(503);
  });

  it('reports the self-audit failure count in health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ db: true, ready: true, selfAuditFailures: 0 });
  });

  describe('audit deployment contract', () => {
    const root = join(__dirname, '..', '..', '..');
    const template = parse(readFileSync(join(root, '.openshift', 'managed', 'audit-service.yml'), 'utf8'));
    const configuration = parse(readFileSync(join(root, '.openshift', 'configuration', 'audit-service.yml'), 'utf8'));
    const service = template.objects.find(({ kind }: { kind: string }) => kind === 'Service');
    const route = template.objects.find(({ kind }: { kind: string }) => kind === 'Route');

    it.each(['api', 'job'])('wires distinct bounded probes and shutdown headroom for the %s workload', (component) => {
      const deployment = template.objects.find(
        (object: { kind: string; metadata: { labels: { component: string } } }) =>
          object.kind === 'Deployment' && object.metadata.labels.component === component,
      );
      const pod = deployment.spec.template.spec;
      const container = pod.containers[0];

      expect(container.livenessProbe.httpGet.path).toBe('/health/live');
      expect(container.readinessProbe.httpGet.path).toBe('/health/ready');
      expect(container.startupProbe.httpGet.path).toBe('/health/live');
      expect(container.readinessProbe.timeoutSeconds * 1000).toBeGreaterThan(HEALTH_CHECK_TIMEOUT_MS);
      expect(pod.terminationGracePeriodSeconds * 1000).toBeGreaterThan(PROCESS_SHUTDOWN_TIMEOUT_MS);
      expect(PROCESS_SHUTDOWN_TIMEOUT_MS).toBeGreaterThan(TRAFFIC_WITHDRAWAL_MS + SHUTDOWN_TIMEOUT_MS);
    });

    it('keeps retention on one separately scheduled pod using the existing database identity', () => {
      const job = template.objects.find(
        (object: { kind: string; metadata: { labels: { component: string } } }) =>
          object.kind === 'Deployment' && object.metadata.labels.component === 'job',
      );

      expect(job.spec.replicas).toBe(1);
      expect(job.spec.strategy).toEqual({ type: 'Recreate' });
      expect(job.spec.template.spec.containers[0].env).toEqual(
        expect.arrayContaining([
          { name: 'RETENTION_ENABLED', value: 'true' },
          {
            name: 'DB_USER',
            valueFrom: { secretKeyRef: { name: '${APP_NAME}-postgres', key: 'database-user' } },
          },
        ]),
      );
      expect(service.spec.selector.component).toBe('api');
    });

    it('disables retention in all three serving replicas even if an existing ConfigMap still enables it', () => {
      const api = template.objects.find(
        (object: { kind: string; metadata: { labels: { component: string } } }) =>
          object.kind === 'Deployment' && object.metadata.labels.component === 'api',
      );

      expect(api.spec.replicas).toBe(3);
      expect(api.spec.template.spec.containers[0].env).toContainEqual({ name: 'RETENTION_ENABLED', value: 'false' });
      expect(configuration.items[0].data.RETENTION_ENABLED).toBe('false');
    });

    it('budgets memory for the byte cap, object overhead, working set and transient allocations', () => {
      const api = template.objects.find(
        (object: { kind: string; metadata: { labels: { component: string } } }) =>
          object.kind === 'Deployment' && object.metadata.labels.component === 'api',
      );
      const plannedMiB = 200 + (4 * MAX_BUFFERED_BYTES) / (1024 * 1024) + 128 + 56;

      expect(api.spec.template.spec.containers[0].resources.limits.memory).toBe(`${plannedMiB}Mi`);
    });

    it('allows 60-second history reads without relaxing the write timeout', () => {
      expect(route.metadata.annotations['haproxy.router.openshift.io/timeout']).toBe('120s');
      expect(HISTORY_QUERY_TIMEOUT_MS).toBe(60_000);
      expect(STATEMENT_TIMEOUT_MS).toBe(4_000);
    });

    it('keeps the existing OTLP metrics export configured', () => {
      expect(configuration.items[0].data.OTEL_EXPORTER_OTLP_ENDPOINT).toBe('http://otel-collector:4318');
    });
  });

  it('stops accepting writes and reports unavailable readiness while draining', async () => {
    configureAction();
    await app.drain();

    const response = await request(app)
      .post('/audit/v1/case-service/events')
      .auth(token([AuditServiceRoles.Writer]), { type: 'bearer' })
      .send({ events: [eventInput()] });

    expect(response.status).toBe(503);
    expect(response.headers['retry-after']).toBe('1');
    expect(PostgresEventRepository.prototype.insert).not.toHaveBeenCalled();
    await request(app).get('/health').expect(503);
  });

  it('releases the connection pool and telemetry once on repeated shutdown', async () => {
    const database = await jest.mocked(createDatabase).mock.results[0].value;
    const platform = await jest.mocked(initializePlatform).mock.results[0].value;

    await Promise.all([app.shutdown(), app.shutdown()]);

    expect(database.knex.destroy).toHaveBeenCalledTimes(1);
    expect(platform.shutdownTelemetry).toHaveBeenCalledTimes(1);
  });
});
