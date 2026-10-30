import { Knex } from 'knex';
import {
  RetentionJobOptions,
  RetentionRepository,
  RetentionRunResult,
  assertRetentionJobOptions,
} from '../audit/jobs/retention';
import { EnrichedEvent } from '../audit/types';
import { insertAuditEvents } from './event';
import { databaseError, STATEMENT_TIMEOUT_MS } from './operation';

// A two-part, database-wide key shared by all tenants and replicas of this job.
const RETENTION_LOCK = [697, 11];

export class PostgresRetentionRepository implements RetentionRepository {
  constructor(private readonly knex: Knex) {}

  async getTenantIds(): Promise<string[]> {
    try {
      const rows = await this.knex('audit_events')
        .distinct<{ tenant_id: string }[]>('tenant_id')
        .orderBy('tenant_id')
        .timeout(STATEMENT_TIMEOUT_MS, { cancel: true });
      return rows.map(({ tenant_id }) => tenant_id);
    } catch (error) {
      throw databaseError(error);
    }
  }

  async run(
    tenantId: string,
    cutoff: Date,
    options: RetentionJobOptions,
    audit: (result: RetentionRunResult) => EnrichedEvent,
  ): Promise<RetentionRunResult | null> {
    assertRetentionJobOptions(options);
    try {
      return await this.knex.transaction(async (transaction) => {
        await transaction.raw(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
        const { rows } = await transaction.raw<{ rows: { locked: boolean }[] }>(
          'SELECT pg_try_advisory_xact_lock(?, ?) AS locked',
          RETENTION_LOCK,
        );
        if (!rows[0].locked) return null;
        const result = await this.deleteBatches(transaction, tenantId, cutoff, options);
        // Commit deletions and their audit together. Failure to record the audit rolls back the run.
        await insertAuditEvents(transaction, [audit(result)]);
        return result;
      });
    } catch (error) {
      throw databaseError(error);
    }
  }

  private async deleteBatches(
    transaction: Knex.Transaction,
    tenantId: string,
    cutoff: Date,
    { batchSize, maxBatches }: RetentionJobOptions,
  ): Promise<RetentionRunResult> {
    const result: RetentionRunResult = { deletedCount: 0, batches: 0 };
    try {
      for (let batch = 0; batch < maxBatches; batch++) {
        // A savepoint rolls back only the failed batch, leaving the outer transaction able to
        // record failure and commit earlier batches with their exact count.
        const count = await transaction.transaction(async (savepoint) => {
          const candidates = savepoint('audit_events')
            .select('id')
            .where({ tenant_id: tenantId })
            .where('retention_until', '<', cutoff)
            .orderBy('retention_until')
            .orderBy('id')
            .limit(batchSize);
          const deleted = await savepoint('audit_events').whereIn('id', candidates).delete().returning('id');
          return deleted.length;
        });
        result.deletedCount += count;
        result.batches++;
        if (count < batchSize) break;
      }
    } catch (error) {
      result.error = databaseError(error).message;
    }
    return result;
  }
}
