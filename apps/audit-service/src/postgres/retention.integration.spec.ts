import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { randomUUID } from 'crypto';
import { knex, Knex } from 'knex';
import * as path from 'path';
import { createLogger, transports } from 'winston';
import { RETENTION_DEFINITION, RetentionRunResult } from '../audit/jobs/retention';
import { RetentionService, DEFAULT_RETENTION_CLASSES } from '../audit/model/retention';
import { enrichEvent } from '../audit/utils/event-preparation';
import { insertAuditEvents } from './event';
import { PostgresRetentionRepository } from './retention';

const connection = process.env.AUDIT_RETENTION_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/audit_retention_test') {
    throw new Error('Retention integration tests require a disposable localhost database named audit_retention_test.');
  }
}

(connection ? describe : describe.skip)('PostgreSQL retention integration', () => {
  const tenant = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const tenantId = tenant.toString();
  const otherTenant = 'urn:ads:platform:tenant-service:v2:/tenants/payment-team';
  const cutoff = new Date('2026-10-22T00:00:00Z');
  let database: Knex;
  let repository: PostgresRetentionRepository;

  function event(days: number, tenant = tenantId, occurredAt = '2026-10-01T00:00:00Z') {
    return enrichEvent(
      {
        eventId: randomUUID(),
        occurredAt,
        action: 'case.update.succeeded',
        status: 'success',
        actor: { id: 'case-worker', type: 'user' },
      },
      { ...RETENTION_DEFINITION, retentionClass: 'custom' },
      {
        tenantId: tenant,
        namespace: 'case-service',
        writtenBy: 'urn:ads:platform:audit-service',
        receivedAt: cutoff,
      },
      { custom: { days } },
    );
  }

  function audit(result: RetentionRunResult) {
    return enrichEvent(
      {
        eventId: randomUUID(),
        occurredAt: cutoff.toISOString(),
        action: result.error ? 'retention.run.failed' : 'retention.run.succeeded',
        status: result.error ? 'failure' : 'success',
        actor: { id: 'urn:ads:platform:audit-service', type: 'system' },
        metadata: { ...result, cutoff: cutoff.toISOString() },
      },
      RETENTION_DEFINITION,
      {
        tenantId,
        namespace: 'audit-service',
        writtenBy: 'urn:ads:platform:audit-service',
        receivedAt: cutoff,
      },
      DEFAULT_RETENTION_CLASSES,
    );
  }

  const run = (batchSize = 2, maxBatches = 2) => repository.run(tenantId, cutoff, { batchSize, maxBatches }, audit);
  const insert = (events: ReturnType<typeof event>[]) =>
    database.transaction((transaction) => insertAuditEvents(transaction, events));

  beforeAll(async () => {
    database = knex({ client: 'pg', connection, pool: { min: 0, max: 4 } });
    await database.migrate.latest({ directory: path.resolve(__dirname, '../../migrations') });
    repository = new PostgresRetentionRepository(database);
  });

  beforeEach(async () => {
    await database('audit_failed_events').delete();
    await database('audit_events').delete();
  });

  afterAll(async () => {
    await database?.destroy();
  });

  it('deletes only expired rows for the selected tenant, preserving the exact expiry boundary', async () => {
    const expired = event(20);
    const boundary = event(21);
    const future = event(22);
    const other = event(20, otherTenant);
    await insert([expired, boundary, future, other]);

    await expect(run()).resolves.toMatchObject({ deletedCount: 1 });

    const survivors = await database('audit_events').where({ namespace: 'case-service' }).pluck('id');
    expect(survivors.sort()).toEqual([boundary.id, future.id, other.id].sort());
  });

  it.each([
    { age: 'one day plus one millisecond', occurredAt: '2026-10-20T23:59:59.999Z', deletedCount: 1, remaining: 0 },
    { age: 'exactly one day', occurredAt: '2026-10-21T00:00:00.000Z', deletedCount: 0, remaining: 1 },
    { age: 'one millisecond short of one day', occurredAt: '2026-10-21T00:00:00.001Z', deletedCount: 0, remaining: 1 },
  ])('enforces one-day retention for an event aged $age', async ({ occurredAt, deletedCount, remaining }) => {
    const original = event(1, tenantId, occurredAt);
    await insert([original]);
    const stored = await database('audit_events').where({ id: original.id }).first();
    expect(stored.retention_until.getTime() - stored.occurred_at.getTime()).toBe(86_400_000);

    await expect(run()).resolves.toMatchObject({ deletedCount });

    expect(await database('audit_events').where({ id: original.id })).toHaveLength(remaining);
    expect(await database('audit_events').where({ namespace: 'audit-service' }).first()).toMatchObject({
      action: 'retention.run.succeeded',
      metadata: { deletedCount },
    });
  });

  it('caps each tenant run at batch size multiplied by maximum batches', async () => {
    await insert([event(1), event(2), event(3), event(4), event(5)]);

    await expect(run()).resolves.toEqual({ deletedCount: 4, batches: 2 });

    expect(await database('audit_events').where({ namespace: 'case-service' })).toHaveLength(1);
    expect(await database('audit_events').where({ namespace: 'audit-service' }).first()).toMatchObject({
      tenant_id: tenantId,
      metadata: { deletedCount: 4, batches: 2 },
    });
  });

  it('records zero-deletion runs without deleting future audit evidence', async () => {
    await insert([event(365)]);

    await expect(run()).resolves.toEqual({ deletedCount: 0, batches: 1 });

    expect(await database('audit_events')).toHaveLength(2);
  });

  it('excludes another connection while the global transaction lock is held and releases it afterwards', async () => {
    const holder = await database.transaction();
    try {
      await holder.raw('SELECT pg_advisory_xact_lock(697, 11)');

      await expect(run()).resolves.toBeNull();

      expect(await database('audit_events')).toHaveLength(0);
    } finally {
      await holder.rollback();
    }
    await expect(run()).resolves.toMatchObject({ deletedCount: 0 });
  });

  it('rolls back the failed batch but commits previous deletions together with a failure record', async () => {
    const blocked = { ...event(2), action: 'blocked' };
    await insert([event(1), blocked, event(3)]);
    await database.raw(`CREATE FUNCTION retention_test_block() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF OLD.action = 'blocked' THEN RAISE EXCEPTION 'test batch failure'; END IF; RETURN OLD; END $$`);
    await database.raw(`CREATE TRIGGER retention_test_block BEFORE DELETE ON audit_events
      FOR EACH ROW EXECUTE FUNCTION retention_test_block()`);
    try {
      await expect(run(1, 3)).resolves.toMatchObject({ deletedCount: 1, batches: 1, error: expect.any(String) });

      expect(await database('audit_events').where({ namespace: 'case-service' })).toHaveLength(2);
      expect(await database('audit_events').where({ namespace: 'audit-service' }).first()).toMatchObject({
        action: 'retention.run.failed',
        status: 'failure',
        metadata: { deletedCount: 1, batches: 1 },
      });
    } finally {
      await database.raw('DROP TRIGGER retention_test_block ON audit_events');
      await database.raw('DROP FUNCTION retention_test_block()');
    }
  });

  it('rolls back deletions if their audit record cannot be stored', async () => {
    const original = event(1);
    await insert([original]);
    await database.raw(
      "ALTER TABLE audit_events ADD CONSTRAINT retention_test_audit CHECK (namespace <> 'audit-service')",
    );
    try {
      await expect(run()).rejects.toThrow('Audit database operation failed');

      expect(await database('audit_events').pluck('id')).toEqual([original.id]);
    } finally {
      await database.raw('ALTER TABLE audit_events DROP CONSTRAINT retention_test_audit');
    }
  });

  it('preserves forward-only expiry in stored rows while new writes use changed configuration', async () => {
    const configuration: jest.Mocked<ConfigurationService> = {
      getConfiguration: jest.fn(),
      getServiceConfiguration: jest.fn(),
      getServiceConfigurationRevision: jest.fn(),
    };
    const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
    const retention = new RetentionService(configuration, logger);
    configuration.getServiceConfiguration
      .mockResolvedValueOnce({
        kind: 'retentionSettings',
        classes: { custom: { days: 30 } },
      })
      .mockResolvedValueOnce(null);
    const oldClasses = await retention.getClasses('case-service', tenant);
    const old = event(oldClasses.custom.days);
    await insert([old]);
    const before = await database('audit_events').where({ id: old.id }).first();

    configuration.getServiceConfiguration
      .mockResolvedValueOnce({
        kind: 'retentionSettings',
        classes: { custom: { days: 60 } },
      })
      .mockResolvedValueOnce(null);
    const newClasses = await retention.getClasses('case-service', tenant);
    const fresh = event(newClasses.custom.days);
    await insert([fresh]);

    expect((await database('audit_events').where({ id: old.id }).first()).retention_until).toEqual(
      before.retention_until,
    );
    expect((await database('audit_events').where({ id: fresh.id }).first()).retention_until).toEqual(
      new Date('2026-11-30T00:00:00Z'),
    );
  });

  it('cascades only linked replayed failures and leaves unreplayed failures alone', async () => {
    const expired = event(1);
    await insert([expired]);
    const failed = {
      tenant_id: tenantId,
      namespace: 'case-service',
      event: {},
      error: 'Test failure',
      attempts: 1,
      failed_at: cutoff,
    };
    const openId = randomUUID();
    await database('audit_failed_events').insert([
      { ...failed, id: randomUUID(), status: 'replayed', replayed_as: expired.id },
      { ...failed, id: openId, status: 'open', replayed_as: null },
    ]);

    await run();

    expect(await database('audit_failed_events').pluck('id')).toEqual([openId]);
  });
});
