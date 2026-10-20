import { knex, Knex } from 'knex';
import { createLogger, transports } from 'winston';
import { AuditStorageUnavailableError, AuditStoreError, FailedAuditEvent } from '../audit/buffer';
import { EnrichedEvent } from '../audit/types';
import { PostgresEventRepository } from './event';

const event: EnrichedEvent = {
  id: 'd7213c24-deaa-40a0-b52a-889aa9ec612e',
  event_id: '54603ec0-b54a-4ebf-a283-87bc0f47dfed',
  tenant_id: 'urn:ads:platform:tenant-service:v2:/tenants/case-team',
  namespace: 'case-service',
  written_by: 'urn:ads:case-team:case-service',
  occurred_at: new Date('2026-10-20T16:00:00Z'),
  received_at: new Date('2026-10-20T16:00:01Z'),
  action: 'case.update',
  action_version: 1,
  category: 'administrative',
  status: 'success',
  severity: 'info',
  actor_id: 'case-worker',
  actor_type: 'user',
  actor_name: 'Case worker',
  actor_email: 'worker@example.test',
  actor_roles: ['case-worker'],
  resource_type: 'case',
  resource_id: 'CASE-1042',
  resource_name: null,
  scope_ids: ['office:edmonton'],
  correlation_id: 'case-workflow',
  session_id: null,
  change_set_before: { status: 'open' },
  change_set_after: { status: 'closed' },
  metadata: { reasonCode: 'RESOLVED' },
  retention_class: 'compliance',
  retention_until: new Date('2027-10-20T16:00:00Z'),
  originalEvent: { action: 'case.update', actor: { id: 'case-worker', type: 'user' } },
};

interface DriverQuery {
  sql: string;
  method?: string;
  response?: { command: string; rows: unknown[]; rowCount: number };
}

describe('PostgresEventRepository', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  let database: Knex;
  let repository: PostgresEventRepository;
  let controller: AbortController;
  let execute: jest.SpyInstance;
  const rows = jest.fn();
  const statements = () => execute.mock.calls.map(([, query]) => query.sql);
  const dataQueries = () => execute.mock.calls.map(([, query]) => query).filter(({ method }) => method === 'insert');

  beforeEach(() => {
    database = knex({ client: 'pg' });
    controller = new AbortController();
    rows.mockReset().mockResolvedValue([]);
    jest.spyOn(database.client, 'acquireConnection').mockResolvedValue({});
    jest.spyOn(database.client, 'releaseConnection').mockResolvedValue(undefined);
    execute = jest
      .spyOn(Object.getPrototypeOf(database.client), '_query')
      .mockImplementation(async (_connection, query: DriverQuery) => {
        const result = ['insert', 'select', 'first'].includes(query.method) ? await rows(query) : [];
        query.response = {
          command: query.method === 'insert' ? 'INSERT' : 'SELECT',
          rows: result,
          rowCount: result.length,
        };
        return query;
      });
    repository = new PostgresEventRepository(database, logger);
  });

  afterEach(async () => {
    await database.destroy();
    jest.restoreAllMocks();
  });

  it('inserts row fields without the original payload and commits before acknowledging ids', async () => {
    rows.mockResolvedValue([{ id: event.id }]);

    const inserted = await repository.insert([event], { signal: controller.signal });

    expect(inserted).toEqual([event.id]);
    expect(statements()).toEqual([
      'BEGIN;',
      'SET LOCAL statement_timeout = 4000',
      expect.stringContaining('on conflict ("tenant_id", "namespace", "event_id") do nothing returning "id"'),
      'COMMIT;',
    ]);
    expect(dataQueries()[0].sql).not.toContain('originalEvent');
    expect(dataQueries()[0].bindings).toEqual(
      expect.arrayContaining([
        event.tenant_id,
        event.namespace,
        event.event_id,
        event.actor_roles,
        event.scope_ids,
        JSON.stringify(event.metadata),
        JSON.stringify(event.change_set_before),
        JSON.stringify(event.change_set_after),
      ]),
    );
  });

  it('returns only inserted service ids so conflicting client event ids are duplicates', async () => {
    const duplicate = { ...event, id: 'e27ec9bd-d449-4f67-bc0a-7e52af6bcaa5' };
    rows.mockResolvedValue([{ id: event.id }]);

    const inserted = await repository.insert([event, duplicate], { signal: controller.signal });

    expect(inserted).toEqual([event.id]);
  });

  it('does not acknowledge an insert when commit fails', async () => {
    const run = execute.getMockImplementation();
    execute.mockImplementation((connection, query) =>
      query.sql === 'COMMIT;' ? Promise.reject({ code: '40001' }) : run(connection, query),
    );
    rows.mockResolvedValue([{ id: event.id }]);

    await expect(repository.insert([event], { signal: controller.signal })).rejects.toMatchObject({
      kind: 'transient',
    });
  });

  it.each([
    ['23505', 'constraint'],
    ['22001', 'constraint'],
    ['40001', 'transient'],
    ['40P01', 'transient'],
    ['08006', 'transient'],
    ['53300', 'transient'],
    ['57014', 'transient'],
    ['57P01', 'transient'],
    ['ECONNRESET', 'transient'],
    ['42501', 'permanent'],
  ])('classifies database error %s as %s and rolls back the batch', async (code, kind) => {
    rows.mockRejectedValue({ code, message: 'SQL with private actor data' });

    const result = repository.insert([event], { signal: controller.signal });

    await expect(result).rejects.toMatchObject({ kind, message: `Audit database operation failed (${code}).` });
    expect(statements()).toContain('ROLLBACK');
    expect(statements()).not.toContain('COMMIT;');
  });

  it('classifies pool acquisition timeouts as transient', async () => {
    jest
      .spyOn(database.client, 'acquireConnection')
      .mockRejectedValue(Object.assign(new Error('Pool exhausted'), { name: 'KnexTimeoutError' }));

    await expect(repository.insert([event], { signal: controller.signal })).rejects.toMatchObject({
      kind: 'transient',
    });
  });

  it('does not acquire a connection for an already cancelled operation', async () => {
    controller.abort();

    await expect(repository.insert([event], { signal: controller.signal })).rejects.toBeInstanceOf(AuditStoreError);
    expect(database.client.acquireConnection).not.toHaveBeenCalled();
  });

  it('rolls back instead of committing when cancelled during a write', async () => {
    rows.mockImplementation(async () => {
      controller.abort();
      return [{ id: event.id }];
    });

    await expect(repository.insert([event], { signal: controller.signal })).rejects.toMatchObject({
      message: 'Audit database operation was cancelled.',
    });
    expect(statements()).toContain('ROLLBACK');
    expect(statements()).not.toContain('COMMIT;');
  });

  it('does not write after cancellation while waiting for a connection', async () => {
    jest.spyOn(database.client, 'acquireConnection').mockImplementation(async () => {
      controller.abort();
      return {};
    });

    await expect(repository.insert([event], { signal: controller.signal })).rejects.toBeInstanceOf(AuditStoreError);
    expect(dataQueries()).toEqual([]);
  });

  it('parks the original event with the migration attempts column in a committed transaction', async () => {
    const failure: FailedAuditEvent = {
      id: event.id,
      event_id: event.event_id,
      tenant_id: event.tenant_id,
      namespace: event.namespace,
      event: event.originalEvent,
      error: 'Audit database operation failed (22001).',
      attempt_count: 2,
      failed_at: new Date(),
      status: 'open',
    };

    await repository.park([failure], { signal: controller.signal });

    expect(dataQueries()[0].sql).toContain('insert into "audit_failed_events"');
    expect(dataQueries()[0].sql).toContain('"attempts"');
    expect(dataQueries()[0].sql).not.toContain('attempt_count');
    expect(dataQueries()[0].bindings).toEqual(
      expect.arrayContaining([JSON.stringify(event.originalEvent), 2, failure.tenant_id, 'open']),
    );
    expect(statements().at(-1)).toBe('COMMIT;');
  });

  it('rejects failed-event storage errors instead of acknowledging parked records', async () => {
    rows.mockRejectedValue({ code: '42501' });
    const failure: FailedAuditEvent = {
      id: event.id,
      event_id: event.event_id,
      tenant_id: event.tenant_id,
      namespace: event.namespace,
      event: event.originalEvent,
      error: 'Write failed',
      attempt_count: 1,
      failed_at: new Date(),
      status: 'open',
    };

    await expect(repository.park([failure], { signal: controller.signal })).rejects.toMatchObject({
      kind: 'permanent',
    });
  });

  it('combines all filters with tenant scope and stable newest-first pagination', async () => {
    rows.mockResolvedValue([event]);

    const result = await repository.find(
      {
        tenantId: event.tenant_id,
        namespace: event.namespace,
        actor: event.actor_id,
        resourceType: 'case',
        resourceId: event.resource_id,
        action: event.action,
        status: 'success',
        category: 'administrative',
        scope: 'office:edmonton',
        occurredFrom: event.occurred_at,
        occurredTo: event.received_at,
      },
      10,
      20,
    );

    expect(result).toEqual([event]);
    expect(execute.mock.calls[0][1]).toMatchObject({
      sql: 'select * from "audit_events" where "tenant_id" = $1 and "namespace" = $2 and "actor_id" = $3 and "resource_type" = $4 and "resource_id" = $5 and "action" = $6 and "status" = $7 and "category" = $8 and scope_ids @> $9::text[] and "occurred_at" >= $10 and "occurred_at" <= $11 order by "occurred_at" desc, "id" desc limit $12 offset $13',
      bindings: [
        event.tenant_id,
        event.namespace,
        event.actor_id,
        'case',
        event.resource_id,
        event.action,
        'success',
        'administrative',
        ['office:edmonton'],
        event.occurred_at,
        event.received_at,
        10,
        20,
      ],
    });
  });

  it('keeps tenant isolation when listing across all namespaces', async () => {
    await repository.find({ tenantId: event.tenant_id }, 10, 0);

    expect(execute.mock.calls[0][1]).toMatchObject({
      sql: 'select * from "audit_events" where "tenant_id" = $1 order by "occurred_at" desc, "id" desc limit $2',
      bindings: [event.tenant_id, 10],
    });
  });

  it('reads a single event only within the supplied tenant and namespace', async () => {
    rows.mockResolvedValue([event]);

    const result = await repository.get(event.tenant_id, event.namespace, event.id);

    expect(result).toEqual(event);
    expect(execute.mock.calls[0][1]).toMatchObject({
      sql: 'select * from "audit_events" where "tenant_id" = $1 and "namespace" = $2 and "id" = $3 limit $4',
      bindings: [event.tenant_id, event.namespace, event.id, 1],
    });
  });

  it('returns null for an event outside the requested scope or absent from storage', async () => {
    await expect(repository.get(event.tenant_id, event.namespace, event.id)).resolves.toBeNull();
  });

  it.each(['find', 'get'])('returns an explicit storage-unavailable error for failed %s queries', async (method) => {
    rows.mockRejectedValue({ code: '08006' });
    const warning = jest.spyOn(logger, 'warn');

    const result =
      method === 'find'
        ? repository.find({ tenantId: event.tenant_id }, 10, 0)
        : repository.get(event.tenant_id, event.namespace, event.id);

    await expect(result).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    expect(warning).toHaveBeenCalledWith('Audit database operation failed (08006).', { context: 'AuditRead' });
  });
});
