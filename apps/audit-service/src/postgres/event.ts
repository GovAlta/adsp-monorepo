import { Knex } from 'knex';
import type { Logger } from 'winston';
import {
  AuditEventStore,
  AuditStorageUnavailableError,
  AuditStoreContext,
  AuditStoreError,
  FailedAuditEvent,
} from '../audit/buffer';
import { EnrichedEvent, EventCriteria, EventReader, StoredEvent } from '../audit/types';

// Bound statements on the server too, including lock waits, within the five-second parking budget.
const STATEMENT_TIMEOUT_MS = 4000;

function databaseError(error: unknown): AuditStoreError {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : '';
  const transient =
    /^(08|40|53)/.test(code) ||
    ['57014', '57P01', '57P02', '57P03', '55P03', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE'].includes(code) ||
    (error instanceof Error && error.name === 'KnexTimeoutError');
  const kind = transient ? 'transient' : /^(22|23)/.test(code) ? 'constraint' : 'permanent';
  // PostgreSQL/Knex messages can include SQL bindings and actor data; do not park or log those messages.
  return new AuditStoreError(`Audit database operation failed${code ? ` (${code})` : ''}.`, kind);
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
    return this.write(context, async (transaction) => {
      if (!events.length) return [];
      const rows = events.map(({ originalEvent: _originalEvent, ...event }) => event);
      const inserted = await transaction<StoredEvent>('audit_events')
        .insert(rows)
        .onConflict(['tenant_id', 'namespace', 'event_id'])
        .ignore()
        .returning('id');
      return inserted.map(({ id }) => id);
    });
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

  async find(criteria: EventCriteria, top: number, skip: number): Promise<StoredEvent[]> {
    const query = this.knex<StoredEvent>('audit_events').where({ tenant_id: criteria.tenantId });
    const filters = {
      namespace: criteria.namespace,
      actor_id: criteria.actor,
      resource_type: criteria.resourceType,
      resource_id: criteria.resourceId,
      action: criteria.action,
      status: criteria.status,
      category: criteria.category,
    };
    for (const [column, value] of Object.entries(filters)) {
      if (value !== undefined) query.where(column, value);
    }
    if (criteria.scope !== undefined) query.whereRaw('scope_ids @> ?::text[]', [[criteria.scope]]);
    if (criteria.occurredFrom) query.where('occurred_at', '>=', criteria.occurredFrom);
    if (criteria.occurredTo) query.where('occurred_at', '<=', criteria.occurredTo);
    return this.read(async () =>
      query
        .orderBy('occurred_at', 'desc')
        .orderBy('id', 'desc')
        .limit(top)
        .offset(skip)
        .timeout(STATEMENT_TIMEOUT_MS, { cancel: true }),
    );
  }

  async get(tenantId: string, namespace: string, id: string): Promise<StoredEvent | null> {
    const row = await this.read(async () =>
      this.knex<StoredEvent>('audit_events')
        .where({ tenant_id: tenantId, namespace, id })
        .first()
        .timeout(STATEMENT_TIMEOUT_MS, { cancel: true }),
    );
    return row ?? null;
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
