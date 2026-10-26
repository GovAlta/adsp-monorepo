import { knex, Knex } from 'knex';
import { randomUUID } from 'crypto';
import { RETENTION_DEFINITION } from '../audit/jobs/retention';
import { DEFAULT_RETENTION_CLASSES } from '../audit/model/retention';
import { enrichEvent } from '../audit/utils/event-preparation';
import { PostgresRetentionRepository } from './retention';

interface DriverQuery {
  sql: string;
  method?: string;
  bindings?: unknown[];
  response?: { command: string; rows: unknown[]; rowCount: number };
}

describe('PostgresRetentionRepository', () => {
  const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/case-team';
  const cutoff = new Date('2026-10-22T00:00:00Z');
  const audit = jest.fn(() =>
    enrichEvent(
      {
        eventId: randomUUID(),
        occurredAt: cutoff.toISOString(),
        action: 'retention.run.succeeded',
        status: 'success',
        actor: { id: 'audit-service', type: 'system' },
      },
      RETENTION_DEFINITION,
      {
        tenantId,
        namespace: 'audit-service',
        writtenBy: 'urn:ads:platform:audit-service',
        receivedAt: cutoff,
      },
      DEFAULT_RETENTION_CLASSES,
    ),
  );
  let database: Knex;
  let repository: PostgresRetentionRepository;
  let execute: jest.SpyInstance;
  const rows = jest.fn();
  const locked = jest.fn();
  const queries = (): DriverQuery[] => execute.mock.calls.map(([, query]) => query);
  const statements = () => queries().map(({ sql }) => sql);
  const run = () => repository.run(tenantId, cutoff, { batchSize: 2, maxBatches: 3 }, audit);

  beforeEach(() => {
    jest.clearAllMocks();
    database = knex({ client: 'pg' });
    rows.mockReset().mockResolvedValue([]);
    locked.mockReturnValue(true);
    jest.spyOn(database.client, 'acquireConnection').mockResolvedValue({});
    jest.spyOn(database.client, 'releaseConnection').mockResolvedValue(undefined);
    execute = jest
      .spyOn(Object.getPrototypeOf(database.client), '_query')
      .mockImplementation(async (_connection, query: DriverQuery) => {
        const result = query.sql.includes('pg_try_advisory_xact_lock')
          ? [{ locked: locked() }]
          : ['del', 'select', 'insert'].includes(query.method)
            ? await rows(query)
            : [];
        query.response = {
          command: query.method === 'del' ? 'DELETE' : 'SELECT',
          rows: result,
          rowCount: result.length,
        };
        return query;
      });
    repository = new PostgresRetentionRepository(database);
  });

  afterEach(async () => {
    await database.destroy();
    jest.restoreAllMocks();
  });

  it('scopes deletion by tenant, expiry and batch limit', async () => {
    await run();
    const deletion = queries().find(({ method }) => method === 'del');

    expect(deletion.sql).toContain('"tenant_id" = $1 and "retention_until" < $2');
    expect(deletion.sql).toContain('order by "retention_until" asc, "id" asc limit $3');
    expect(deletion.bindings).toEqual([tenantId, cutoff, 2]);
  });

  it('commits exactly the bounded number of batches and records the total', async () => {
    rows.mockResolvedValue([{ id: randomUUID() }, { id: randomUUID() }]);

    await expect(run()).resolves.toEqual({ deletedCount: 6, batches: 3 });
    expect(queries().filter(({ method }) => method === 'del')).toHaveLength(3);
    expect(audit).toHaveBeenCalledWith({ deletedCount: 6, batches: 3 });
    expect(statements().at(-1)).toBe('COMMIT;');
  });

  it('commits earlier batches and a failure audit after rolling back a failed batch to its savepoint', async () => {
    rows
      .mockResolvedValueOnce([{ id: randomUUID() }, { id: randomUUID() }])
      .mockRejectedValueOnce({ code: '57014', message: 'private SQL' });

    await expect(run()).resolves.toEqual({
      deletedCount: 2,
      batches: 1,
      error: 'Audit database operation failed (57014).',
    });
    expect(statements()).toEqual(expect.arrayContaining([expect.stringContaining('ROLLBACK TO SAVEPOINT'), 'COMMIT;']));
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ deletedCount: 2, error: expect.not.stringContaining('private') }),
    );
  });

  it('rolls back all deletions if the audit insert fails', async () => {
    rows.mockResolvedValueOnce([{ id: randomUUID() }]).mockRejectedValueOnce({ code: '23514' });

    await expect(run()).rejects.toThrow('Audit database operation failed (23514).');
    expect(statements()).toContain('ROLLBACK');
    expect(statements()).not.toContain('COMMIT;');
  });

  it('does no work when another replica owns the lock', async () => {
    locked.mockReturnValue(false);

    await expect(run()).resolves.toBeNull();
    expect(rows).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it('shares one lock key across tenants', async () => {
    await run();
    await repository.run('another-tenant', cutoff, { batchSize: 2, maxBatches: 3 }, audit);

    expect(
      queries()
        .filter(({ sql }) => sql.includes('pg_try_advisory_xact_lock'))
        .map(({ bindings }) => bindings),
    ).toEqual([
      [697, 11],
      [697, 11],
    ]);
  });

  it('enumerates tenants already present in the store', async () => {
    rows.mockResolvedValue([{ tenant_id: tenantId }]);

    await expect(repository.getTenantIds()).resolves.toEqual([tenantId]);
    expect(statements()[0]).toContain('select distinct "tenant_id"');
  });
});
