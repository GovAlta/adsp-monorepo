import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { knex, Knex } from 'knex';
import { createLogger, transports } from 'winston';
import { REPLAY_DEFINITION } from '../audit/actions';
import { AuditStorageUnavailableError } from '../audit/buffer';
import { DEFAULT_RETENTION_CLASSES } from '../audit/model/retention';
import { enrichEvent } from '../audit/utils/event-preparation';
import { PostgresFailedEventRepository } from './failed-events';

interface DriverQuery {
  sql: string;
  method?: string;
  bindings?: unknown[];
  response?: { command: string; rows: unknown[]; rowCount: number };
}

describe('PostgresFailedEventRepository', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/case-team';
  const id = randomUUID();
  const event = enrichEvent(
    {
      eventId: randomUUID(),
      occurredAt: '2026-10-20T00:00:00Z',
      action: 'case.update.succeeded',
      status: 'success',
      actor: { id: 'original-actor', type: 'user' },
    },
    REPLAY_DEFINITION,
    {
      tenantId,
      namespace: 'case-service',
      writtenBy: 'urn:ads:platform:audit-service',
      receivedAt: new Date(),
    },
    DEFAULT_RETENTION_CLASSES,
  );
  let database: Knex;
  let repository: PostgresFailedEventRepository;
  let execute: jest.SpyInstance;
  const rows = jest.fn();
  const statements = () => execute.mock.calls.map(([, query]) => query.sql);
  const queries = () => execute.mock.calls.map(([, query]) => query as DriverQuery);

  beforeEach(() => {
    database = knex({ client: 'pg' });
    rows.mockReset().mockResolvedValue([]);
    jest.spyOn(logger, 'warn');
    jest.spyOn(database.client, 'acquireConnection').mockResolvedValue({});
    jest.spyOn(database.client, 'releaseConnection').mockResolvedValue(undefined);
    execute = jest
      .spyOn(Object.getPrototypeOf(database.client), '_query')
      .mockImplementation(async (_connection, query: DriverQuery) => {
        const result = query.method ? await rows(query) : [];
        query.response = {
          command: query.method === 'update' ? 'UPDATE' : query.method === 'insert' ? 'INSERT' : 'SELECT',
          rows: result,
          rowCount: result.length,
        };
        return query;
      });
    repository = new PostgresFailedEventRepository(database, logger);
  });

  afterEach(async () => {
    await database.destroy();
    jest.restoreAllMocks();
  });

  it('filters pages by tenant and orders deterministically before applying limit', async () => {
    await repository.list(tenantId, 10);
    expect(queries()[0]).toMatchObject({
      sql: expect.stringContaining('where "tenant_id" = $1 order by "failed_at" desc, "id" desc limit $2'),
      bindings: [tenantId, 10],
    });
  });

  it('resumes strictly after the cursor row', async () => {
    const after = { failedAt: new Date('2026-10-01T00:00:00Z'), id: '54862935-e55b-4bc4-8cd0-9e64b193bbd2' };
    await repository.list(tenantId, 10, after);
    expect(queries()[0]).toMatchObject({
      sql: expect.stringContaining('(failed_at, id) < ($2, $3) order by "failed_at" desc, "id" desc limit $4'),
      bindings: [tenantId, after.failedAt, after.id, 10],
    });
  });

  it('counts open rows across tenants without selecting event payloads', async () => {
    rows.mockResolvedValue([{ count: '12' }]);
    await expect(repository.countOpen()).resolves.toBe(12);
    expect(queries()[0]).toMatchObject({
      sql: 'select count(*) as "count" from "audit_failed_events" where "status" = $1',
      bindings: ['open'],
    });
  });

  it.each(['-1', 'not-a-count', '9007199254740992'])('rejects an invalid aggregate %s', async (count) => {
    rows.mockResolvedValue([{ count }]);
    await expect(repository.countOpen()).rejects.toBeInstanceOf(AuditStorageUnavailableError);
  });

  it('locks the tenant row and atomically saves the event, link and replay audit', async () => {
    rows.mockImplementation(async (query: DriverQuery) => (query.method === 'insert' ? [{ id: event.id }] : [{ id }]));
    await repository.withReplayTransaction(tenantId, async (transaction) => {
      await transaction.getForUpdate(id);
      expect(await transaction.insertReplayedEvent(event)).toBe(event.id);
      await transaction.markReplayed(id, event.id);
      await transaction.insertReplayAudit({ ...event, namespace: 'audit-service' });
    });
    expect(statements()).toEqual([
      'BEGIN TRANSACTION ISOLATION LEVEL read committed;',
      'SET LOCAL statement_timeout = 4000',
      'SET LOCAL idle_in_transaction_session_timeout = 10000',
      expect.stringContaining('where "tenant_id" = $1 and "id" = $2 limit $3 for update'),
      expect.stringContaining('insert into "audit_events"'),
      expect.stringContaining(
        'update "audit_failed_events" set "status" = $1, "replayed_as" = $2 where "tenant_id" = $3 and "id" = $4 and "status" = $5',
      ),
      expect.stringContaining('insert into "audit_events"'),
      'COMMIT;',
    ]);
    expect(queries().find(({ method }) => method === 'update').bindings).toEqual([
      'replayed',
      event.id,
      tenantId,
      id,
      'open',
    ]);
  });

  it('links an existing tenant/namespace/event identity without updating append-only audit rows', async () => {
    rows.mockImplementation(async (query: DriverQuery) => (query.method === 'insert' ? [] : [{ id: 'existing-row' }]));
    const result = await repository.withReplayTransaction(tenantId, (transaction) =>
      transaction.insertReplayedEvent(event),
    );
    expect(result).toBe('existing-row');
    expect(queries().find(({ method }) => method === 'first')).toMatchObject({
      sql: expect.stringContaining('where "tenant_id" = $1 and "namespace" = $2 and "event_id" = $3'),
      bindings: [tenantId, event.namespace, event.event_id, 1],
    });
    expect(statements().some((sql) => sql.startsWith('update'))).toBe(false);
  });

  it('rolls back if an existing conflicting event cannot be found', async () => {
    await expect(
      repository.withReplayTransaction(tenantId, (transaction) => transaction.insertReplayedEvent(event)),
    ).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    expect(statements()).toContain('ROLLBACK');
  });

  it.each(['insertReplayedEvent', 'insertReplayAudit'] as const)(
    'rejects cross-tenant writes in %s',
    async (method) => {
      await expect(
        repository.withReplayTransaction(tenantId, async (transaction) => {
          await transaction[method]({ ...event, tenant_id: 'other-tenant' });
        }),
      ).rejects.toBeInstanceOf(AuditStorageUnavailableError);
      expect(statements().some((sql) => sql.startsWith('insert'))).toBe(false);
      expect(statements()).toContain('ROLLBACK');
    },
  );

  it('rejects state transitions that did not update exactly one open row', async () => {
    await expect(
      repository.withReplayTransaction(tenantId, (transaction) => transaction.markReplayed(id, event.id)),
    ).rejects.toMatchObject({ extra: { statusCode: 409 } });
    expect(statements()).toContain('ROLLBACK');
  });

  it('requires a newly inserted self-audit row', async () => {
    await expect(
      repository.withReplayTransaction(tenantId, (transaction) =>
        transaction.insertReplayAudit({ ...event, namespace: 'audit-service' }),
      ),
    ).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    expect(statements()).toContain('ROLLBACK');
  });

  it.each([
    new NotFoundError('failed audit event', id),
    new InvalidOperationError('Already replayed', { statusCode: 409 }),
    new InvalidOperationError('Invalid original payload'),
  ])('preserves domain errors while rolling back', async (error) => {
    await expect(
      repository.withReplayTransaction(tenantId, async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(statements()).toContain('ROLLBACK');
  });

  it.each(['first', 'insert', 'update', 'COMMIT;'])(
    'does not acknowledge database failure during %s',
    async (stage) => {
      rows.mockResolvedValue([{ id: event.id }]);
      const run = execute.getMockImplementation();
      execute.mockImplementation((connection, query) =>
        query.method === stage || query.sql === stage
          ? Promise.reject({ code: '40001', message: 'SQL with secret payload' })
          : run(connection, query),
      );
      await expect(
        repository.withReplayTransaction(tenantId, async (transaction) => {
          await transaction.getForUpdate(id);
          await transaction.insertReplayedEvent(event);
          await transaction.markReplayed(id, event.id);
        }),
      ).rejects.toMatchObject({ message: expect.not.stringContaining('secret') });
      expect(logger.warn).toHaveBeenCalledWith('Audit database operation failed (40001).', expect.anything());
      if (stage !== 'COMMIT;') expect(statements()).toContain('ROLLBACK');
    },
  );
});
