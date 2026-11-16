import { AdspId, adspId, auditDefinitions, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler, UnauthorizedError } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import { randomUUID } from 'crypto';
import * as express from 'express';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { REPLAY_ACTION, REPLAY_DEFINITION } from '../actions';
import { AuditBatchTooLargeError, AuditStorageUnavailableError } from '../buffer/store';
import { CatalogService, FailedEventService, RateLimitService, ReplayEventPreparer, RetentionService } from '../model';
import { CatalogActionStore, CatalogApplicationSource } from '../model/catalog-source';
import { AuditServiceRoles } from '../roles';
import {
  EVENT_OUTCOME_STATUS,
  EventReader,
  EventSubmitter,
  FAILED_EVENT_STATUS,
  FailedAuditEvent,
  FailedEventReplayTransaction,
  FailedEventRepository,
  StoredEvent,
} from '../types';
import { MAX_JSON_FIELD_BYTES } from '../utils/event-validation';
import { EventRateLimiter } from '../utils/rate-limiter';
import { createAuditJsonParser, MAX_BATCH_EVENTS } from '../utils/request-validation';
import { assertTenantContext, createAuditRouter, validateTenantContext } from './index';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerJSDoc = require('swagger-jsdoc');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SwaggerParser = require('swagger-parser');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerDefinition = require('../../../swagger.config');

// Compiles the same sources as the webpack build, so that the documentation is checked as it is served.
function compileSpecification() {
  return swaggerJSDoc({ swaggerDefinition, apis: [join(__dirname, '*.swagger.yml')] });
}

describe('audit service API documentation', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenant = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const otherTenant = 'urn:ads:platform:tenant-service:v2:/tenants/other-team';
  const serviceId = adspId`urn:ads:platform:audit-service`;
  const eventId = '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11';
  const failedId = '3f1c2a9e-7b4d-4e8a-9c21-5d6e7f8a9b0c';

  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const source: jest.Mocked<CatalogApplicationSource> = { listApplications: jest.fn() };
  const store: jest.Mocked<CatalogActionStore> = {
    readActionNames: jest.fn(),
    saveAction: jest.fn(),
    removeAction: jest.fn(),
  };
  const submitter: jest.Mocked<EventSubmitter> = { submit: jest.fn() };
  const reader: jest.Mocked<EventReader> = { find: jest.fn(), get: jest.fn(), findNamespaces: jest.fn() };
  const failedRepository: jest.Mocked<FailedEventRepository> = {
    list: jest.fn(),
    countOpen: jest.fn(),
    withReplayTransaction: jest.fn(),
  };
  const transaction: jest.Mocked<FailedEventReplayTransaction> = {
    getForUpdate: jest.fn(),
    insertReplayedEvent: jest.fn(),
    markReplayed: jest.fn(),
    insertReplayAudit: jest.fn(),
  };

  function createRouter() {
    const catalogs = new CatalogService(configuration, logger, source, store);
    const retention = new RetentionService(configuration, logger);
    return createAuditRouter({
      catalogs,
      retention,
      logger,
      submitter,
      reader,
      rateLimit: {
        limits: new RateLimitService(configuration, logger, { eventsPerSecond: 500, burst: 500 }),
        limiter: new EventRateLimiter(),
        metrics: { recordRateLimited: jest.fn() },
        logger,
      },
      failedEvents: new FailedEventService(
        failedRepository,
        serviceId.toString(),
        { recordParkedEvent: jest.fn(), recordWriteFailure: jest.fn() },
        new ReplayEventPreparer(catalogs, retention),
      ),
    });
  }

  const router = createRouter();

  describe('specification', () => {
    it('is a valid OpenAPI document', async () => {
      await expect(SwaggerParser.validate(JSON.parse(JSON.stringify(compileSpecification())))).resolves.toBeDefined();
    });

    it('documents exactly the routes the router serves', () => {
      const served = router.stack
        .filter((layer) => layer.route)
        .flatMap((layer) =>
          Object.keys((layer.route as unknown as { methods: Record<string, boolean> }).methods).map(
            (method) => `${method} /audit/v1${layer.route.path.replace(/:(\w+)/g, '{$1}')}`,
          ),
        )
        .sort();
      const documented = Object.entries(compileSpecification().paths)
        .flatMap(([path, operations]) => Object.keys(operations as object).map((method) => `${method} ${path}`))
        .sort();

      expect(served).toHaveLength(13);
      expect(documented).toEqual(served);
    });

    it('documents the write limits that the implementation enforces', () => {
      const specification = compileSpecification();
      const write = specification.paths['/audit/v1/{namespace}/events'].post;
      const eventsSchema = write.requestBody.content['application/json'].schema.properties.events;

      expect(eventsSchema.maxItems).toBe(MAX_BATCH_EVENTS);
      expect(MAX_JSON_FIELD_BYTES).toBe(16 * 1024);
      expect(write.description).toContain('16 KiB');
      expect(write.description).toContain('does not mean every event was stored');
    });

    it('documents rate limiting separately from buffer pressure', () => {
      const write = compileSpecification().paths['/audit/v1/{namespace}/events'].post;

      expect(write.responses['429'].headers['Retry-After'].schema.type).toBe('integer');
      expect(write.responses['429'].description).toContain('No events in the request were stored');
      expect(write.responses['503'].description).toContain('buffer is temporarily full');
      expect(write.description).toContain('Admitted events consume allowance even if storage later fails');
    });

    it('documents every error status for each operation', () => {
      const specification = compileSpecification();
      const missing = Object.entries(specification.paths).flatMap(([path, operations]) =>
        Object.entries(operations as Record<string, { responses: Record<string, unknown> }>)
          .filter(([, operation]) => !['401', '403', '503'].every((status) => status in operation.responses))
          .map(([method]) => `${method} ${path}`),
      );

      expect(missing).toEqual([]);
    });
  });

  describe('responses', () => {
    let directory: string;
    let documented: ReturnType<typeof createDocumentedResponseRecorder>;

    const writer: User = {
      id: 'case-writer',
      name: 'Case writer',
      email: '',
      isCore: false,
      roles: [AuditServiceRoles.Writer, AuditServiceRoles.Reader],
      tenantId: tenant,
      token: {
        azp: 'urn:ads:case-team:case-service',
        aud: 'urn:ads:platform:audit-service',
        iss: 'tenant-issuer',
        bearer: 'test',
        email_verified: false,
      },
    };
    const reading: User = { ...writer, id: 'case-reader', name: 'Case reader', roles: [AuditServiceRoles.Reader] };
    const admin: User = { ...writer, id: 'case-admin', name: 'Case admin', roles: [AuditServiceRoles.Admin] };
    const coreAdmin: User = { ...admin, isCore: true, tenantId: undefined };
    const noRoles: User = { ...writer, roles: [] };

    // Mirrors the main.ts mounts: authentication and tenant resolution on /audit, the router on /audit/v1.
    function createApp(caller: User | null = writer) {
      const app = express();
      app.use(documented.middleware);
      app.use(createAuditJsonParser());
      app.use('/audit', (req, _res, next) => {
        req.user = caller;
        req.isAuthenticated = (): this is Express.AuthenticatedRequest => !!caller;
        next();
      });
      app.use('/audit', assertAuthenticatedHandler, validateTenantContext, assertTenantContext);
      app.use('/audit', (req, _res, next) => {
        const id = caller?.isCore && req.query.tenantId ? AdspId.parse(String(req.query.tenantId)) : caller?.tenantId;
        if (id) req.tenant = { id, name: 'Case team', realm: 'case-team' };
        next();
      });
      app.use('/audit/v1', createRouter());
      app.use(createErrorHandler(logger));
      return app;
    }

    const catalogs: Record<string, unknown> = {
      'actions-case-service': {
        kind: 'actionCatalog',
        application: 'case-service',
        actions: {
          'case.update': {
            version: 1,
            category: 'administrative',
            severity: 'info',
            resourceType: 'case',
            captureChangeSet: false,
            forwardToSiem: false,
          },
        },
      },
      'actions-audit-service': {
        kind: 'actionCatalog',
        application: 'audit-service',
        actions: auditDefinitions({ REPLAY: { name: REPLAY_ACTION, ...REPLAY_DEFINITION } }),
      },
    };

    function createEvent() {
      return {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        action: 'case.update',
        status: 'success',
        actor: { id: 'test.user@gov.ab.ca', type: 'user' },
        resource: { type: 'case', id: 'case-001' },
      };
    }

    const storedEvent: StoredEvent = {
      id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      event_id: eventId,
      tenant_id: tenant.toString(),
      namespace: 'case-service',
      written_by: 'urn:ads:case-team:case-service',
      occurred_at: new Date('2026-11-02T18:04:10.000Z'),
      received_at: new Date('2026-11-02T18:04:10.412Z'),
      action: 'case.update',
      action_version: 1,
      category: 'administrative',
      status: 'success',
      severity: 'info',
      actor_id: 'test.user@gov.ab.ca',
      actor_type: 'user',
      actor_name: 'Test User',
      actor_email: 'test.user@gov.ab.ca',
      actor_roles: [],
      resource_type: 'case',
      resource_id: 'case-001',
      resource_name: null,
      scope_ids: [],
      correlation_id: null,
      session_id: null,
      change_set_before: null,
      change_set_after: null,
      metadata: {},
      retention_class: 'compliance',
      retention_until: new Date('2027-11-02T18:04:10.000Z'),
    };

    const failedEvent = (): FailedAuditEvent => ({
      id: failedId,
      tenant_id: tenant.toString(),
      namespace: 'case-service',
      event_id: eventId,
      event: { ...createEvent(), eventId },
      error: 'Audit database write timed out.',
      attempts: 3,
      failed_at: new Date('2026-11-02T18:04:11.000Z'),
      status: FAILED_EVENT_STATUS.OPEN,
      replayed_as: null,
    });

    beforeAll(() => {
      directory = mkdtempSync(join(tmpdir(), 'audit-docs-'));
      const file = join(directory, 'swagger.json');
      writeFileSync(file, JSON.stringify(compileSpecification()));
      documented = createDocumentedResponseRecorder(file);
    });

    afterAll(() => {
      rmSync(directory, { recursive: true, force: true });
    });

    beforeEach(() => {
      jest.resetAllMocks();
      configuration.getServiceConfiguration.mockImplementation(async (name: string) => catalogs[name] ?? null);
      source.listApplications.mockResolvedValue([]);
      store.readActionNames.mockResolvedValue(null);
      store.saveAction.mockResolvedValue();
      reader.find.mockResolvedValue([storedEvent]);
      reader.get.mockResolvedValue(storedEvent);
      reader.findNamespaces.mockResolvedValue(['case-service']);
      submitter.submit.mockImplementation(
        async (events) => new Map(events.map(({ id }) => [id, { status: EVENT_OUTCOME_STATUS.ACCEPTED }])),
      );
      failedRepository.list.mockResolvedValue([failedEvent()]);
      failedRepository.withReplayTransaction.mockImplementation(async (_tenantId, work) => work(transaction));
      transaction.getForUpdate.mockResolvedValue(failedEvent());
      transaction.insertReplayedEvent.mockResolvedValue(storedEvent.id);
    });

    afterEach(async () => {
      await documented.assertDocumented();
    });

    // Every route sits behind the same authentication and tenant guards.
    describe.each([
      ['get', '/audit/v1/retention'],
      ['get', '/audit/v1/actions'],
      ['get', '/audit/v1/case-service/actions'],
      ['post', '/audit/v1/case-service/actions'],
      ['get', '/audit/v1/namespaces'],
      ['get', '/audit/v1/events'],
      ['get', '/audit/v1/case-service/events'],
      ['get', `/audit/v1/case-service/events/${storedEvent.id}`],
      ['get', '/audit/v1/events/export'],
      ['get', '/audit/v1/case-service/events/export'],
      ['post', '/audit/v1/case-service/events'],
      ['get', '/audit/v1/failed-events'],
      ['post', `/audit/v1/failed-events/${failedId}/replay`],
    ])('%s %s', (method: 'get' | 'post', path) => {
      it('responds 401 without a user', async () => {
        await request(createApp(null))[method](path).expect(401);
      });

      it('responds 400 to an invalid tenant ID', async () => {
        await request(createApp(coreAdmin))[method](path).query({ tenantId: 'case-team' }).expect(400);
      });

      it('responds 403 to a tenant caller selecting another tenant', async () => {
        await request(createApp())[method](path).query({ tenantId: otherTenant }).expect(403);
      });

      it('responds 403 without the required role', async () => {
        await request(createApp(noRoles))[method](path).expect(403);
      });
    });

    describe('GET /audit/v1/retention', () => {
      it('responds 200 with the configured periods', async () => {
        const result = await request(createApp(reading)).get('/audit/v1/retention').expect(200);
        expect(result.body).toEqual({ tenant: {}, applications: {} });
      });

      it('responds 503 when retention settings are invalid', async () => {
        configuration.getServiceConfiguration.mockResolvedValue({ kind: 'actionCatalog' });
        await request(createApp(reading)).get('/audit/v1/retention').expect(503);
      });
    });

    describe('GET /audit/v1/actions', () => {
      it('responds 200 with the visible catalogs', async () => {
        source.listApplications.mockResolvedValue(['case-service']);
        const result = await request(createApp(reading)).get('/audit/v1/actions').expect(200);
        expect(result.body[0]).toMatchObject({ application: 'case-service', core: true });
      });

      it('responds 503 when catalogs cannot be listed', async () => {
        source.listApplications.mockRejectedValue(new Error('Configuration service is unavailable.'));
        await request(createApp(reading)).get('/audit/v1/actions').expect(503);
      });
    });

    describe('GET /audit/v1/{namespace}/actions', () => {
      it('responds 200 with the action definitions', async () => {
        const result = await request(createApp(reading)).get('/audit/v1/case-service/actions').expect(200);
        expect(result.body[0]).toMatchObject({ name: 'case.update', version: 1 });
      });

      it('responds 400 to an invalid namespace', async () => {
        await request(createApp(reading)).get('/audit/v1/Case_Service/actions').expect(400);
      });

      it('responds 404 to an unregistered catalog', async () => {
        await request(createApp(reading)).get('/audit/v1/payment-service/actions').expect(404);
      });

      it('responds 503 to an inconsistent catalog', async () => {
        configuration.getServiceConfiguration.mockResolvedValue({ kind: 'actionCatalog', application: 'other' });
        await request(createApp(reading)).get('/audit/v1/case-service/actions').expect(503);
      });
    });

    describe('POST /audit/v1/{namespace}/actions', () => {
      const action = { name: 'case.close', version: 1, category: 'administrative', severity: 'info' };

      it('responds 201 with the added action', async () => {
        const result = await request(createApp(admin))
          .post('/audit/v1/case-service/actions')
          .set('Authorization', 'Bearer test')
          .send(action)
          .expect(201);
        expect(result.body).toEqual(action);
      });

      it('responds 400 to an invalid action', async () => {
        await request(createApp(admin))
          .post('/audit/v1/case-service/actions')
          .send({ ...action, category: 'other' })
          .expect(400);
      });

      it('responds 400 to a Core caller without a tenant', async () => {
        await request(createApp(coreAdmin))
          .post('/audit/v1/case-service/actions')
          .set('Authorization', 'Bearer test')
          .send(action)
          .expect(400);
      });

      it('responds 401 when the caller cannot change configuration', async () => {
        store.saveAction.mockRejectedValue(
          new UnauthorizedError('Writing the action catalog requires permission to change configuration.'),
        );
        await request(createApp(admin))
          .post('/audit/v1/case-service/actions')
          .set('Authorization', 'Bearer test')
          .send(action)
          .expect(401);
      });

      it('responds 409 to an existing action name', async () => {
        store.readActionNames.mockResolvedValue(['Case.Close']);
        await request(createApp(admin))
          .post('/audit/v1/case-service/actions')
          .set('Authorization', 'Bearer test')
          .send(action)
          .expect(409);
      });

      it('responds 503 when catalogs cannot be checked', async () => {
        source.listApplications.mockRejectedValue(new Error('Configuration service is unavailable.'));
        await request(createApp(admin))
          .post('/audit/v1/case-service/actions')
          .set('Authorization', 'Bearer test')
          .send(action)
          .expect(503);
      });
    });

    describe('GET /audit/v1/namespaces', () => {
      it('responds 200 with the namespaces', async () => {
        const result = await request(createApp(reading)).get('/audit/v1/namespaces').expect(200);
        expect(result.body).toEqual({ results: ['case-service'] });
      });

      it('responds 403 to a Core caller without a tenant', async () => {
        await request(createApp({ ...reading, isCore: true, tenantId: undefined }))
          .get('/audit/v1/namespaces')
          .expect(403);
      });

      it('responds 503 when storage is unavailable', async () => {
        reader.findNamespaces.mockRejectedValue(
          new AuditStorageUnavailableError('Audit event storage is unavailable.'),
        );
        await request(createApp(reading)).get('/audit/v1/namespaces').expect(503);
      });
    });

    describe.each(['/audit/v1/events', '/audit/v1/case-service/events'])('GET %s', (path) => {
      it('responds 200 with a page of events', async () => {
        const result = await request(createApp(reading)).get(path).query({ top: 1 }).expect(200);
        expect(result.body.results[0]).toMatchObject({ id: storedEvent.id, eventId });
        expect(result.body.page.next).toBeDefined();
      });

      it('responds 400 to an invalid filter', async () => {
        await request(createApp(reading)).get(path).query({ status: 'unknown' }).expect(400);
      });

      it('responds 503 when storage is unavailable', async () => {
        reader.find.mockRejectedValue(new AuditStorageUnavailableError('Audit event storage is unavailable.'));
        await request(createApp(reading)).get(path).expect(503);
      });
    });

    describe.each(['/audit/v1/events/export', '/audit/v1/case-service/events/export'])('GET %s', (path) => {
      it('responds 200 with CSV', async () => {
        reader.find.mockResolvedValueOnce([storedEvent]).mockResolvedValue([]);
        const result = await request(createApp(reading)).get(path).expect(200);
        expect(result.headers['content-type']).toContain('text/csv');
        expect(result.text).toContain(storedEvent.id);
      });

      it('responds 400 to an invalid date range', async () => {
        await request(createApp(reading))
          .get(path)
          .query({ occurredFrom: '2026-11-02T00:00:00Z', occurredTo: '2026-11-01T00:00:00Z' })
          .expect(400);
      });

      it('responds 503 when storage is unavailable', async () => {
        reader.find.mockRejectedValue(new AuditStorageUnavailableError('Audit event storage is unavailable.'));
        await request(createApp(reading)).get(path).expect(503);
      });
    });

    describe('GET /audit/v1/{namespace}/events/{id}', () => {
      const path = `/audit/v1/case-service/events/${storedEvent.id}`;

      it('responds 200 with the event', async () => {
        const result = await request(createApp(reading)).get(path).expect(200);
        expect(result.body).toMatchObject({ id: storedEvent.id, actor: { name: 'Test User' } });
      });

      it('responds 400 to an invalid id', async () => {
        await request(createApp(reading)).get('/audit/v1/case-service/events/not-a-uuid').expect(400);
      });

      it('responds 404 to a missing event', async () => {
        reader.get.mockResolvedValue(null);
        await request(createApp(reading)).get(path).expect(404);
      });

      it('responds 503 when storage is unavailable', async () => {
        reader.get.mockRejectedValue(new AuditStorageUnavailableError('Audit event storage is unavailable.'));
        await request(createApp(reading)).get(path).expect(503);
      });
    });

    describe('POST /audit/v1/{namespace}/events', () => {
      const path = '/audit/v1/case-service/events';

      it('responds 202 with the per-event outcome', async () => {
        const result = await request(createApp())
          .post(path)
          .send({ events: [createEvent(), { eventId: 'not-a-uuid' }] })
          .expect(202);
        expect(result.body).toMatchObject({ accepted: 1, duplicates: 0 });
        expect(result.body.rejected).toHaveLength(1);
      });

      it('responds 400 to an invalid envelope', async () => {
        await request(createApp()).post(path).send({ events: [] }).expect(400);
      });

      it('responds 400 to a Core writer without a tenant', async () => {
        await request(
          createApp({
            ...writer,
            isCore: true,
            tenantId: undefined,
            token: { ...writer.token, azp: serviceId.toString() },
          }),
        )
          .post(path)
          .send({ events: [createEvent()] })
          .expect(400);
      });

      it('responds 403 to a write in a namespace the caller does not own', async () => {
        await request(createApp())
          .post('/audit/v1/payment-service/events')
          .send({ events: [createEvent()] })
          .expect(403);
      });

      it('responds 413 to a batch that does not fit the buffer', async () => {
        submitter.submit.mockRejectedValue(new AuditBatchTooLargeError('Audit batch exceeds the buffer byte limit.'));
        await request(createApp())
          .post(path)
          .send({ events: [createEvent()] })
          .expect(413);
      });

      it('responds 429 when the write rate limit is exceeded', async () => {
        const app = createApp();
        const events = Array.from({ length: MAX_BATCH_EVENTS }, () => ({}));
        await request(app).post(path).send({ events }).expect(202);
        const result = await request(app).post(path).send({ events }).expect(429);
        expect(result.headers['retry-after']).toBeDefined();
      });

      it('responds 503 when storage is unavailable', async () => {
        submitter.submit.mockRejectedValue(new AuditStorageUnavailableError('Audit buffer is at capacity.'));
        const result = await request(createApp())
          .post(path)
          .send({ events: [createEvent()] })
          .expect(503);
        expect(result.headers['retry-after']).toBe('1');
      });
    });

    describe('GET /audit/v1/failed-events', () => {
      it('responds 200 with a page of failed events', async () => {
        const result = await request(createApp(admin)).get('/audit/v1/failed-events').expect(200);
        expect(result.body.results[0]).toMatchObject({ id: failedId, status: 'open' });
      });

      it('responds 400 to an invalid page size', async () => {
        await request(createApp(admin)).get('/audit/v1/failed-events').query({ top: 0 }).expect(400);
      });

      it('responds 400 to a Core administrator without a tenant', async () => {
        await request(createApp(coreAdmin)).get('/audit/v1/failed-events').expect(400);
      });

      it('responds 503 when storage is unavailable', async () => {
        failedRepository.list.mockRejectedValue(new Error('Connection terminated.'));
        await request(createApp(admin)).get('/audit/v1/failed-events').expect(503);
      });
    });

    describe('POST /audit/v1/failed-events/{id}/replay', () => {
      const path = `/audit/v1/failed-events/${failedId}/replay`;

      it('responds 200 with the replayed event', async () => {
        const result = await request(createApp(admin)).post(path).expect(200);
        expect(result.body).toMatchObject({ id: failedId, status: 'replayed', replayed_as: storedEvent.id });
      });

      it('responds 400 to an invalid id', async () => {
        await request(createApp(admin)).post('/audit/v1/failed-events/not-a-uuid/replay').expect(400);
      });

      it('responds 404 to a missing failed event', async () => {
        transaction.getForUpdate.mockResolvedValue(null);
        await request(createApp(admin)).post(path).expect(404);
      });

      it('responds 409 to a closed failed event', async () => {
        transaction.getForUpdate.mockResolvedValue({ ...failedEvent(), status: FAILED_EVENT_STATUS.REPLAYED });
        await request(createApp(admin)).post(path).expect(409);
      });

      it('responds 503 when storage is unavailable', async () => {
        failedRepository.withReplayTransaction.mockRejectedValue(new Error('Connection terminated.'));
        await request(createApp(admin)).post(path).expect(503);
      });
    });
  });
});
