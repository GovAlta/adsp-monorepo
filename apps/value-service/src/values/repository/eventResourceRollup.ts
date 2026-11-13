import { Knex } from 'knex';
import { EventResourceCoverage, EventResourceCriteria, MetricIntervalWindow, ResourceRollupSource } from '../types';
import { withTransactionLock } from './metricIntervalRollup';

export interface EventResourceRollupRepository {
  getCoverage(source: ResourceRollupSource): Promise<EventResourceCoverage | null>;
  // The end of the newest event log chunk that starts before the given time, or null when nothing is
  // stored before it. Read from chunk metadata, so it opens none of the chunks.
  getEventLogEndBefore(before: Date): Promise<Date | null>;
  // Callers must pass a window that touches or overlaps existing coverage, as with the metric
  // interval rollups: coverage is stored as a single span.
  refresh(source: ResourceRollupSource, window: MetricIntervalWindow): Promise<number>;
  countDistinct(criteria: EventResourceCriteria): Promise<number>;
  // Runs work while holding the rollup lock, resolving to null without running it when another
  // instance holds the lock. The repository handed to the callback is bound to the locked
  // connection, so callers must use it rather than the one they called this on.
  withRollupLock<T>(work: (repository: EventResourceRollupRepository) => Promise<T>): Promise<T | null>;
}

// A key of its own rather than the metric interval rollup's: the two jobs write different tables, so
// neither has to wait for the other, and each still excludes its own replicas. The ticket number.
export const EVENT_RESOURCE_ROLLUP_LOCK_KEY = 5533;

const EVENT_LOG_NAMESPACE = 'event-service';
const EVENT_LOG_NAME = 'event';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const floorUtcDay = (date: Date): Date => new Date(Math.floor(date.getTime() / MS_PER_DAY) * MS_PER_DAY);
const ceilUtcDay = (date: Date): Date => new Date(Math.ceil(date.getTime() / MS_PER_DAY) * MS_PER_DAY);
const laterOf = (left: Date, right: Date): Date => (left > right ? left : right);
const earlierOf = (left: Date, right: Date): Date => (left < right ? left : right);
// knex.raw expands an array binding into a comma-separated list, so a Postgres array parameter
// cannot be bound directly; one placeholder per value keeps the bindings and the SQL in step.
const placeholders = (values: unknown[]): string => values.map(() => '?').join(', ');

type CoverageRow = {
  covered_from: Date | string;
  covered_to: Date | string;
};

type Part = { sql: string; bindings: unknown[] };

export class TimescaleEventResourceRollupRepository implements EventResourceRollupRepository {
  constructor(
    private knex: Knex,
    private statementTimeoutMs = 0,
  ) {}

  async withRollupLock<T>(work: (repository: EventResourceRollupRepository) => Promise<T>): Promise<T | null> {
    return withTransactionLock(this.knex, EVENT_RESOURCE_ROLLUP_LOCK_KEY, this.statementTimeoutMs, (trx) =>
      work(new TimescaleEventResourceRollupRepository(trx, this.statementTimeoutMs)),
    );
  }

  async getCoverage({ namespace, contextKey }: ResourceRollupSource): Promise<EventResourceCoverage | null> {
    const row = await this.knex('event_resource_rollup_coverage')
      .where({ namespace, context_key: contextKey })
      .first<CoverageRow>();

    return row
      ? { namespace, contextKey, coveredFrom: new Date(row.covered_from), coveredTo: new Date(row.covered_to) }
      : null;
  }

  async getEventLogEndBefore(before: Date): Promise<Date | null> {
    const row = await this.knex('timescaledb_information.chunks')
      .where({ hypertable_name: 'values' })
      .where('range_start', '<', before)
      .max({ end: 'range_end' })
      .first<{ end?: Date | string | null }>();

    return row?.end ? new Date(row.end) : null;
  }

  /**
   * Record which resources each tenant's events named, per day, across the window.
   *
   * The window is cut to whole days before anything reads, in the application rather than with
   * time_bucket in the predicate, so the planner gets plain timestamps and excludes chunks at plan
   * time instead of locking every chunk first. Days are UTC, which is where time_bucket puts them.
   *
   * Recomputing a day overwrites its counts; the event log is append-only, so a resource seen once
   * in a day stays seen and nothing has to be removed.
   */
  async refresh(source: ResourceRollupSource, window: MetricIntervalWindow): Promise<number> {
    const start = floorUtcDay(window.start);
    const end = floorUtcDay(window.end);
    if (start >= end) {
      return 0;
    }

    const result = await this.knex.raw(
      `INSERT INTO event_resource_rollups
         (bucket, tenant, namespace, name, context_key, resource, count, updated_at)
       SELECT time_bucket('1 day'::interval, "timestamp"), tenant, ?::text, context->>'name', ?::text,
              context->>?::text, COUNT(*), NOW()
       FROM "values"
       WHERE ${this.eventLogPredicate(source.names)}
       GROUP BY 1, 2, 4, 6
       ON CONFLICT (bucket, tenant, namespace, name, context_key, resource)
       DO UPDATE SET count = EXCLUDED.count, updated_at = NOW()`,
      [source.namespace, source.contextKey, source.contextKey, ...this.eventLogBindings(source, start, end)],
    );

    await this.extendCoverage(source, start, end);

    return result?.rowCount ?? 0;
  }

  /**
   * Count the distinct resources a tenant's events named over a period.
   *
   * Whole days inside coverage come from the rollup; whatever is left at either edge -- today, which
   * is never rolled up, or history the backfill has not reached yet -- is read from the event log
   * for that span alone. The parts are unioned before counting, since a resource seen in both is
   * still one resource.
   */
  async countDistinct(criteria: EventResourceCriteria): Promise<number> {
    const { from, to } = criteria;
    const coverage = await this.getCoverage(criteria);
    const rolledFrom = coverage ? laterOf(ceilUtcDay(from), coverage.coveredFrom) : null;
    const rolledTo = coverage ? earlierOf(floorUtcDay(to), coverage.coveredTo) : null;

    const parts: Part[] = [];
    if (rolledFrom && rolledTo && rolledFrom < rolledTo) {
      parts.push(this.rolledUpPart(criteria, rolledFrom, rolledTo));
      if (from < rolledFrom) {
        parts.push(this.eventLogPart(criteria, from, rolledFrom));
      }
      if (rolledTo < to) {
        parts.push(this.eventLogPart(criteria, rolledTo, to));
      }
    } else {
      parts.push(this.eventLogPart(criteria, from, to));
    }

    const result = await this.knex.raw<{ rows: { count: number | string }[] }>(
      `SELECT COUNT(DISTINCT resource)::int AS count FROM (${parts.map(({ sql }) => sql).join(' UNION ALL ')}) AS resources`,
      parts.flatMap(({ bindings }) => bindings),
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  private rolledUpPart({ tenant, namespace, names, contextKey }: EventResourceCriteria, from: Date, to: Date): Part {
    return {
      sql: `SELECT resource FROM event_resource_rollups
            WHERE tenant = ? AND namespace = ? AND context_key = ? AND name IN (${placeholders(names)})
              AND bucket >= ? AND bucket < ?`,
      bindings: [tenant, namespace, contextKey, ...names, from, to],
    };
  }

  private eventLogPart(criteria: EventResourceCriteria, from: Date, to: Date): Part {
    return {
      sql: `SELECT context->>?::text AS resource FROM "values" WHERE tenant = ? AND ${this.eventLogPredicate(criteria.names)}`,
      bindings: [criteria.contextKey, criteria.tenant, ...this.eventLogBindings(criteria, from, to)],
    };
  }

  // Event log records naming one of the source's events and carrying the resource. The time range is
  // half-open so adjacent windows neither overlap nor leave a gap.
  private eventLogPredicate(names: string[]): string {
    return `namespace = ? AND name = ? AND "timestamp" >= ? AND "timestamp" < ?
       AND tenant IS NOT NULL AND context @> ?::jsonb AND context->>'name' IN (${placeholders(names)})
       AND COALESCE(context->>?::text, '') <> ''`;
  }

  private eventLogBindings({ namespace, names, contextKey }: ResourceRollupSource, from: Date, to: Date): unknown[] {
    return [EVENT_LOG_NAMESPACE, EVENT_LOG_NAME, from, to, JSON.stringify({ namespace }), ...names, contextKey];
  }

  // Coverage describes whole days only, with an exclusive end, like the metric interval coverage.
  private async extendCoverage(source: ResourceRollupSource, coveredFrom: Date, coveredTo: Date): Promise<void> {
    await this.knex.raw(
      `INSERT INTO event_resource_rollup_coverage (namespace, context_key, covered_from, covered_to, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON CONFLICT (namespace, context_key) DO UPDATE SET
         covered_from = LEAST(event_resource_rollup_coverage.covered_from, EXCLUDED.covered_from),
         covered_to = GREATEST(event_resource_rollup_coverage.covered_to, EXCLUDED.covered_to),
         updated_at = NOW()`,
      [source.namespace, source.contextKey, coveredFrom, coveredTo],
    );
  }
}
