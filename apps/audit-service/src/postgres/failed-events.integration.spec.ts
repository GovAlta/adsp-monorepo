import { AdspId, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import * as express from 'express';
import { knex, Knex } from 'knex';
import * as path from 'path';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { REPLAY_ACTION, REPLAY_DEFINITION } from '../audit/actions';
import { CatalogService } from '../audit/model/catalog';
import { FailedEventService } from '../audit/model/failed-events';
import { ReplayEventPreparer } from '../audit/model/replay-events';
import { RetentionService } from '../audit/model/retention';
import { failedEventHandler, validateFailedEventId, validateFailedEventPage } from '../audit/router/failed-events';
import { FailedAuditEvent } from '../audit/types';
import { PostgresFailedEventRepository } from './failed-events';
import { PostgresEventRepository } from './event';

// This suite deletes test rows. Never accept a shared/deployed database.
const connection = process.env.AUDIT_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/audit_replay_test') {
    throw new Error('Replay integration tests require a disposable localhost database named audit_replay_test.');
  }
}

(connection ? describe : describe.skip)('PostgreSQL failed-event replay integration', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/case-team';
  const otherTenant = 'urn:ads:platform:tenant-service:v2:/tenants/other-team';
  const writer = 'urn:ads:platform:audit-service';
  const administrator: User = {
    id: 'administrator',
    roles: ['audit-admin'],
    name: 'Administrator',
    email: '',
    isCore: false,
    token: { azp: 'test-client', aud: writer, iss: 'test', bearer: '', email_verified: false },
  };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const metrics = { recordParkedEvent: jest.fn(), recordWriteFailure: jest.fn() };
  let database: Knex;
  let repository: PostgresFailedEventRepository;
  let service: FailedEventService;
  let preparer: ReplayEventPreparer;
  let failed: FailedAuditEvent;

  beforeAll(async () => {
    database = knex({ client: 'pg', connection, pool: { min: 0, max: 5 } });
    await database.raw(
      "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'audit_app') THEN CREATE ROLE audit_app; END IF; END $$",
    );
    await database.migrate.latest({ directory: path.resolve(__dirname, '../../migrations') });
  });

  beforeEach(async () => {
    await database('audit_failed_events').delete();
    await database('audit_events').delete();
    configuration.getServiceConfiguration.mockImplementation(async (name) => {
      if (name === 'actions-case-service') {
        return {
          kind: 'actionCatalog',
          application: 'case-service',
          actions: { 'case.update': { ...REPLAY_DEFINITION, resourceType: 'case' } },
        };
      }
      if (name === 'actions-audit-service') {
        return {
          kind: 'actionCatalog',
          application: 'audit-service',
          actions: { [REPLAY_ACTION]: REPLAY_DEFINITION },
        };
      }
      return null;
    });
    repository = new PostgresFailedEventRepository(database, logger);
    preparer = new ReplayEventPreparer(
      new CatalogService(configuration, logger),
      new RetentionService(configuration, logger),
    );
    service = new FailedEventService(repository, writer, metrics, preparer);
    const eventId = randomUUID();
    failed = {
      id: randomUUID(),
      tenant_id: tenantId,
      namespace: 'case-service',
      event_id: eventId,
      event: {
        eventId,
        occurredAt: '2026-01-01T00:00:00Z',
        action: 'case.update.succeeded',
        status: 'success',
        actor: { id: 'original-actor', type: 'user', roles: ['case-worker'] },
        resource: { type: 'case', id: 'CASE-1' },
      },
      error: 'Storage failed',
      attempts: 4,
      failed_at: new Date(),
      status: 'open',
      replayed_as: null,
    };
    const { attempts, replayed_as: _replayedAs, ...parked } = failed;
    await new PostgresEventRepository(database, logger).park([{ ...parked, status: 'open', attempt_count: attempts }], {
      signal: new AbortController().signal,
    });
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    await database?.destroy();
  });

  it('serves both HTTP endpoints with persisted rows and records the replay atomically', async () => {
    const app = express();
    app.use((req, _res, next) => {
      req.user = administrator;
      // Authentication/tenant resolution are covered by app.spec.ts.
      req.tenant = { id: AdspId.parse(tenantId), name: 'Case team', realm: 'case-team' };
      next();
    });
    app.get('/audit/v1/failed-events', validateFailedEventPage, failedEventHandler(service, logger, 'list'));
    app.post(
      '/audit/v1/failed-events/:id/replay',
      validateFailedEventId,
      failedEventHandler(service, logger, 'replay'),
    );
    app.use(createErrorHandler(logger));

    const page = await request(app).get('/audit/v1/failed-events').expect(200);
    expect(page.body.results).toHaveLength(1);
    expect(page.body.results[0].id).toBe(failed.id);
    expect(page.body.results[0].attempts).toBe(4);
    expect(page.body.results[0].event).toEqual(failed.event);
    const response = await request(app).post(`/audit/v1/failed-events/${failed.id}/replay`).expect(200);
    expect(response.body).toMatchObject({ status: 'replayed', replayed_as: expect.any(String) });
    const original = await database('audit_events').where({ id: response.body.replayed_as }).first();
    expect(original).toMatchObject({
      actor_id: 'original-actor',
      actor_roles: ['case-worker'],
      written_by: writer,
      namespace: 'case-service',
      occurred_at: new Date('2026-01-01T00:00:00Z'),
    });
    const audit = await database('audit_events').where({ namespace: 'audit-service' }).first();
    expect(audit).toMatchObject({
      actor_id: administrator.id,
      written_by: writer,
      action: 'failed-event.replay.succeeded',
      resource_id: failed.id,
      metadata: { replayedAs: original.id },
    });
    expect(await repository.countOpen()).toBe(0);
    await request(app).post(`/audit/v1/failed-events/${failed.id}/replay`).expect(409);
  });

  it('allows only one concurrent replay of the same failed row', async () => {
    const results = await Promise.allSettled([
      service.replay(tenantId, failed.id, administrator),
      service.replay(tenantId, failed.id, administrator),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(results.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: { extra: { statusCode: 409 } },
    });
    expect(await database('audit_events')).toHaveLength(2);
  });

  it('rolls back the recovered row and status if the self-audit insert fails', async () => {
    await database.raw(
      "ALTER TABLE audit_events ADD CONSTRAINT replay_test_self_audit CHECK (namespace <> 'audit-service')",
    );
    try {
      await expect(service.replay(tenantId, failed.id, administrator)).rejects.toThrow('temporarily unavailable');
      expect(await database('audit_events')).toHaveLength(0);
      expect(await database('audit_failed_events').where({ id: failed.id }).first()).toMatchObject({
        status: 'open',
        replayed_as: null,
      });
    } finally {
      await database.raw('ALTER TABLE audit_events DROP CONSTRAINT replay_test_self_audit');
    }
  });

  it('deduplicates concurrent replays of different failed rows with the same original event identity', async () => {
    const secondId = randomUUID();
    await database('audit_failed_events').insert({ ...failed, id: secondId });
    const [first, second] = await Promise.all([
      service.replay(tenantId, failed.id, administrator),
      service.replay(tenantId, secondId, administrator),
    ]);
    expect(first.replayed_as).toBe(second.replayed_as);
    expect(await database('audit_events').where({ namespace: 'case-service' })).toHaveLength(1);
    expect(await database('audit_events').where({ namespace: 'audit-service' })).toHaveLength(2);
    expect(await repository.countOpen()).toBe(0);
  });

  it('rolls back until the registered replay action becomes available', async () => {
    const configured = configuration.getServiceConfiguration.getMockImplementation();
    configuration.getServiceConfiguration.mockImplementation(async (name, tenant) =>
      name === 'actions-audit-service' ? null : configured(name, tenant),
    );
    await expect(service.replay(tenantId, failed.id, administrator)).rejects.toMatchObject({
      extra: { statusCode: 503 },
    });
    expect(await database('audit_events')).toHaveLength(0);
    expect(await database('audit_failed_events').where({ id: failed.id }).first()).toMatchObject({
      status: 'open',
      replayed_as: null,
    });
    configuration.getServiceConfiguration.mockImplementation(configured);
    await expect(service.replay(tenantId, failed.id, administrator)).resolves.toMatchObject({ status: 'replayed' });
  });

  it('rolls back rather than holding a row lock through a stalled configuration request', async () => {
    const event = await preparer.prepare(failed, writer);
    jest.spyOn(preparer, 'prepare').mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10500));
      return event;
    });
    await expect(service.replay(tenantId, failed.id, administrator)).rejects.toThrow('temporarily unavailable');
    expect(await repository.countOpen()).toBe(1);
    expect(await database('audit_events')).toHaveLength(0);
    await expect(service.replay(tenantId, failed.id, administrator)).resolves.toMatchObject({ status: 'replayed' });
  }, 15000);

  it('reuses an existing audit identity without overwriting its original writer or duplicating it', async () => {
    const existing = await preparer.prepare(failed, 'urn:ads:case-team:original-writer');
    await new PostgresEventRepository(database, logger).insert([existing], { signal: new AbortController().signal });
    const result = await service.replay(tenantId, failed.id, administrator);
    expect(result.replayed_as).toBe(existing.id);
    expect(await database('audit_events').where({ namespace: 'case-service' })).toHaveLength(1);
    expect(await database('audit_events').where({ id: existing.id }).first()).toMatchObject({
      written_by: 'urn:ads:case-team:original-writer',
    });
  });

  it('never exposes or replays another tenant row, while counting all open rows', async () => {
    await database('audit_failed_events').insert({ ...failed, id: randomUUID(), tenant_id: otherTenant });
    expect((await service.list(tenantId, 10)).results).toHaveLength(1);
    expect(await repository.countOpen()).toBe(2);
    await expect(service.replay(otherTenant, failed.id, administrator)).rejects.toMatchObject({
      extra: { statusCode: 404 },
    });
    expect(await database('audit_events')).toHaveLength(0);
  });

  it('rejects discarded rows and leaves them unchanged', async () => {
    await database('audit_failed_events').where({ id: failed.id }).update({ status: 'discarded' });
    await expect(service.replay(tenantId, failed.id, administrator)).rejects.toMatchObject({
      extra: { statusCode: 409 },
    });
    expect(await database('audit_events')).toHaveLength(0);
  });

  it('keeps validation failures open with no partial audit writes', async () => {
    await database('audit_failed_events')
      .where({ id: failed.id })
      .update({ event: { invalid: true } });
    await expect(service.replay(tenantId, failed.id, administrator)).rejects.toThrow('cannot be replayed');
    expect(await repository.countOpen()).toBe(1);
    expect(await database('audit_events')).toHaveLength(0);
  });

  it('persists replay state and metrics across connection-pool restart', async () => {
    const replayed = await service.replay(tenantId, failed.id, administrator);
    await database.destroy();
    database = knex({ client: 'pg', connection, pool: { min: 0, max: 5 } });
    repository = new PostgresFailedEventRepository(database, logger);
    expect((await repository.list(tenantId, 10))[0]).toMatchObject({
      status: 'replayed',
      replayed_as: replayed.replayed_as,
    });
    expect(await repository.countOpen()).toBe(0);
  });

  it('grants only the failed-row update columns and permits replay with the application role', async () => {
    await database.transaction(async (transaction) => {
      await transaction.raw('SET LOCAL ROLE audit_app');
      const limitedRepository = new PostgresFailedEventRepository(transaction, logger);
      const limitedService = new FailedEventService(limitedRepository, writer, metrics, preparer);
      await expect(limitedService.replay(tenantId, failed.id, administrator)).resolves.toMatchObject({
        status: 'replayed',
      });
      const { rows } = await transaction.raw(`SELECT
        has_table_privilege(current_user, 'audit_events', 'UPDATE') AS event_update,
        has_table_privilege(current_user, 'audit_events', 'DELETE') AS event_delete,
        has_column_privilege(current_user, 'audit_failed_events', 'event', 'UPDATE') AS payload_update,
        has_column_privilege(current_user, 'audit_failed_events', 'status', 'UPDATE') AS status_update`);
      expect(rows[0]).toEqual({ event_update: false, event_delete: false, payload_update: false, status_update: true });
    });
  });
});
