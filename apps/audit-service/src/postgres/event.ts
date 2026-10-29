import { Knex } from 'knex';
import type { Logger } from 'winston';
import {
  AuditEventStore,
  AuditStorageUnavailableError,
  AuditStoreContext,
  AuditStoreError,
  FailedAuditEvent,
} from '../audit/buffer';
import { EnrichedEvent, EventCriteria, EventCursor, EventReader, StoredEvent } from '../audit/types';
import { databaseError, HISTORY_QUERY_TIMEOUT_MS, STATEMENT_TIMEOUT_MS } from './operation';

export async function insertAuditEvents(
  transaction: Knex.Transaction,
  events: readonly EnrichedEvent[],
): Promise<string[]> {
  if (!events.length) return [];
  const rows = events.map(({ originalEvent: _originalEvent, ...event }) => event);
  const inserted = await transaction<StoredEvent>('audit_events')
    .insert(rows)
    .onConflict(['tenant_id', 'namespace', 'event_id'])
    .ignore()
    .returning('id');
  return inserted.map(({ id }) => id);
}

function assertActive(signal: AbortSignal): void {
  if (signal.aborted) throw new AuditStoreError('Audit database operation was cancelled.', 'permanent');
}

export class PostgresEventRepository implements AuditEventStore, EventReader {
  constructor(
    private readonly knex: Knex,
    private readonly logger: Logger,
  ) {}

  async insert(events: readonly EnrichedEvent[], context: AuditStoreContext): Promise<readonly string[]> {
    return this.write(context, (transaction) => insertAuditEvents(transaction, events));
  }

  async park(events: readonly FailedAuditEvent[], context: AuditStoreContext): Promise<void> {
    await this.write(context, async (transaction) => {
      if (!events.length) return;
      const rows = events.map(({ attempt_count, event, ...failure }) => ({
        ...failure,
        attempts: attempt_count,
        event: JSON.stringify(event),
      }));
      await transaction('audit_failed_events').insert(rows);
    });
  }

  async find(criteria: EventCriteria, top: number, after?: EventCursor): Promise<StoredEvent[]> {
    const query = this.knex<StoredEvent>('audit_events').where({ tenant_id: criteria.tenantId });
    const filters = {
      namespace: criteria.namespace,
      actor_id: criteria.actor,
      resource_type: criteria.resourceType,
      resource_id: criteria.resourceId,
      action: criteria.action,
      status: criteria.status,
      category: criteria.category,
      severity: criteria.severity,
      correlation_id: criteria.correlationId,
      session_id: criteria.sessionId,
    };
    for (const [column, value] of Object.entries(filters)) {
      if (value !== undefined) query.where(column, value);
    }
    if (criteria.scope !== undefined) query.whereRaw('scope_ids @> ?::text[]', [[criteria.scope]]);
    if (criteria.occurredFrom) query.where('occurred_at', '>=', criteria.occurredFrom);
    if (criteria.occurredTo) query.where('occurred_at', '<=', criteria.occurredTo);
    if (after) query.whereRaw('(occurred_at, id) < (?, ?)', [after.occurredAt, after.id]);
    return this.read(async () =>
      query
        .orderBy('occurred_at', 'desc')
        .orderBy('id', 'desc')
        .limit(top)
        .timeout(HISTORY_QUERY_TIMEOUT_MS, { cancel: true }),
    );
  }

  async get(tenantId: string, namespace: string, id: string): Promise<StoredEvent | null> {
    const row = await this.read(async () =>
      this.knex<StoredEvent>('audit_events')
        .where({ tenant_id: tenantId, namespace, id })
        .first()
        .timeout(HISTORY_QUERY_TIMEOUT_MS, { cancel: true }),
    );
    return row ?? null;
  }

  // Walks the (tenant_id, namespace, ...) unique index one namespace at a time, so the cost depends on the
  // number of namespaces rather than the number of events.
  async findNamespaces(tenantId: string): Promise<string[]> {
    const result = await this.read(async () =>
      this.knex
        .raw<{ rows: { namespace: string }[] }>(
          `WITH RECURSIVE namespaces AS (
             (SELECT namespace FROM audit_events WHERE tenant_id = ? ORDER BY namespace LIMIT 1)
             UNION ALL
             SELECT (SELECT namespace FROM audit_events WHERE tenant_id = ? AND namespace > namespaces.namespace ORDER BY namespace LIMIT 1)
             FROM namespaces WHERE namespaces.namespace IS NOT NULL
           )
           SELECT namespace FROM namespaces WHERE namespace IS NOT NULL`,
          [tenantId, tenantId],
        )
        .timeout(HISTORY_QUERY_TIMEOUT_MS, { cancel: true }),
    );
    return result.rows.map(({ namespace }) => namespace);
  }

  private async write<T>(
    { signal }: AuditStoreContext,
    operation: (transaction: Knex.Transaction) => Promise<T>,
  ): Promise<T> {
    assertActive(signal);
    try {
      return await this.knex.transaction(async (transaction) => {
        // Check again after pool acquisition; a timed-out caller must not start a late write.
        assertActive(signal);
        await transaction.raw(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
        assertActive(signal);
        const result = await operation(transaction);
        // Throwing rolls back before Knex commits, even when cancellation happened during the statement.
        assertActive(signal);
        return result;
      });
    } catch (error) {
      throw error instanceof AuditStoreError ? error : databaseError(error);
    }
  }

  private async read<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.warn(databaseError(error).message, { context: 'AuditRead' });
      throw new AuditStorageUnavailableError('Audit event storage is unavailable. Retry the request.');
    }
  }
}
