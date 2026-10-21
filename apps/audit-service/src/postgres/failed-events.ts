import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { CONFLICT } from 'http-status-codes';
import { Knex } from 'knex';
import type { Logger } from 'winston';
import { AuditStorageUnavailableError } from '../audit/buffer';
import {
  EnrichedEvent,
  FailedAuditEvent,
  FailedEventCursor,
  FailedEventRepository,
  FailedEventReplayTransaction,
  StoredEvent,
} from '../audit/types';
import { insertAuditEvents } from './event';
import { databaseError, STATEMENT_TIMEOUT_MS } from './operation';

export class PostgresFailedEventRepository implements FailedEventRepository {
  constructor(
    private readonly knex: Knex,
    private readonly logger: Logger,
  ) {}

  async list(tenantId: string, top: number, after?: FailedEventCursor): Promise<FailedAuditEvent[]> {
    return this.execute(() => {
      const query = this.knex<FailedAuditEvent>('audit_failed_events').where({ tenant_id: tenantId });
      if (after) query.whereRaw('(failed_at, id) < (?, ?)', [after.failedAt, after.id]);
      return query
        .orderBy('failed_at', 'desc')
        .orderBy('id', 'desc')
        .limit(top)
        .timeout(STATEMENT_TIMEOUT_MS, { cancel: true });
    });
  }

  async countOpen(): Promise<number> {
    return this.execute(async () => {
      const [result] = await this.knex('audit_failed_events')
        .where({ status: 'open' })
        .count<{ count: string }[]>('* as count')
        .timeout(STATEMENT_TIMEOUT_MS, { cancel: true });
      const count = Number(result.count);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid failed-event count.');
      return count;
    });
  }

  async withReplayTransaction<T>(
    tenantId: string,
    work: (transaction: FailedEventReplayTransaction) => Promise<T>,
  ): Promise<T> {
    return this.execute(() =>
      this.knex.transaction(
        async (transaction) => {
          await transaction.raw(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
          // Catalog/retention requests must not leave a row locked indefinitely.
          await transaction.raw('SET LOCAL idle_in_transaction_session_timeout = 10000');
          return work({
            getForUpdate: async (id) =>
              (await transaction<FailedAuditEvent>('audit_failed_events')
                .where({ tenant_id: tenantId, id })
                .forUpdate()
                .first()) ?? null,
            insertReplayedEvent: (event) => this.insertReplay(transaction, tenantId, event),
            markReplayed: async (id, replayedAs) => {
              const updated = await transaction('audit_failed_events')
                .where({ tenant_id: tenantId, id, status: 'open' })
                .update({ status: 'replayed', replayed_as: replayedAs });
              if (updated !== 1)
                throw new InvalidOperationError('Failed event is no longer open.', { statusCode: CONFLICT });
            },
            insertReplayAudit: async (event) => {
              this.assertTenant(event, tenantId);
              if (event.namespace !== 'audit-service') throw new Error('Invalid replay audit namespace.');
              const inserted = await insertAuditEvents(transaction, [event]);
              if (inserted.length !== 1) throw new Error('Replay audit was not inserted.');
            },
          });
        },
        { isolationLevel: 'read committed' },
      ),
    );
  }

  private async insertReplay(transaction: Knex.Transaction, tenantId: string, event: EnrichedEvent): Promise<string> {
    this.assertTenant(event, tenantId);
    const [inserted] = await insertAuditEvents(transaction, [event]);
    if (inserted) return inserted;
    // An earlier ingestion/replay may already have stored this event. Never update an append-only row.
    const existing = await transaction<StoredEvent>('audit_events')
      .where({ tenant_id: tenantId, namespace: event.namespace, event_id: event.event_id })
      .first();
    if (!existing) throw new Error('Conflicting audit event could not be found.');
    return existing.id;
  }

  private assertTenant(event: EnrichedEvent, tenantId: string): void {
    if (event.tenant_id !== tenantId) throw new Error('Replay event tenant does not match the transaction.');
  }

  private async execute<T>(operation: () => PromiseLike<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof InvalidOperationError || error instanceof NotFoundError) throw error;
      this.logger.warn(databaseError(error).message, { context: 'AuditFailedEvents' });
      throw new AuditStorageUnavailableError('Failed-event storage is temporarily unavailable. Retry the request.');
    }
  }
}
