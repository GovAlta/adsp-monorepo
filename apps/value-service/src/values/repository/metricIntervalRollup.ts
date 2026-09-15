import { Knex } from 'knex';
import { MetricInterval, MetricIntervalCoverage, MetricIntervalWindow } from '../types';

export interface MetricIntervalRollupRepository {
  getMetricsWindow(): Promise<MetricIntervalWindow | null>;
  getCoverage(interval: MetricInterval): Promise<MetricIntervalCoverage | null>;
  // Callers must pass a window that touches or overlaps existing coverage; coverage is stored as a
  // single span, so a detached window would report the gap between them as rolled up. A null source
  // aggregates the raw metrics table; otherwise the named interval's own buckets are aggregated.
  refresh(
    interval: MetricInterval,
    bucket: string,
    source: MetricInterval | null,
    window: MetricIntervalWindow,
  ): Promise<number>;
  // Runs work while holding the rollup lock, resolving to null without running it when another
  // instance holds the lock. The repository handed to the callback is bound to the locked
  // connection, so callers must use it rather than the one they called this on.
  withRollupLock<T>(work: (repository: MetricIntervalRollupRepository) => Promise<T>): Promise<T | null>;
}

// Every replica has to ask for the same key for the lock to mean anything, so this is arbitrary but
// has to stay stable. Advisory keys share one database-wide space; this one is the ticket number.
export const METRIC_INTERVAL_ROLLUP_LOCK_KEY = 5318;

type RangeRow = {
  start?: Date | string | null;
  end?: Date | string | null;
};

type CoverageRow = {
  covered_from: Date | string;
  covered_to: Date | string;
};

export class TimescaleMetricIntervalRollupRepository implements MetricIntervalRollupRepository {
  constructor(
    private knex: Knex,
    private statementTimeoutMs = 0,
  ) {}

  /**
   * Hold the rollup lock for one interval's advance.
   *
   * Every replica schedules this job, and the cron tick fires whether or not the last run finished,
   * so without a lock the same windows are recomputed several times over concurrently -- which is
   * what exhausted the database's connection slots in dev.
   *
   * Scoped to one interval rather than a whole run so that the work commits as it goes: coverage is
   * per interval, so this is already the unit whose read-and-extend has to be atomic, and an
   * interval that exceeds its statement timeout then rolls back only itself.
   *
   * pg_try_advisory_xact_lock is scoped to the transaction: it is taken on that transaction's own
   * connection and released when it ends, so the lock cannot be released onto a different pooled
   * connection than the one that took it, nor outlive a run whose pod was killed. The try_ form
   * rather than the blocking one, because a replica that loses the race should skip this tick
   * instead of queueing up behind the winner and running the same work a moment later.
   */
  async withRollupLock<T>(work: (repository: MetricIntervalRollupRepository) => Promise<T>): Promise<T | null> {
    return this.knex.transaction(async (trx) => {
      const result = await trx.raw<{ rows: { locked: boolean }[] }>('SELECT pg_try_advisory_xact_lock(?) AS locked', [
        METRIC_INTERVAL_ROLLUP_LOCK_KEY,
      ]);

      if (!result?.rows?.[0]?.locked) {
        return null;
      }

      if (this.statementTimeoutMs > 0) {
        // A refresh that runs away holds its connection for as long as it takes, and the pool is
        // shared with the API. SET LOCAL so the timeout reverts when the transaction ends rather
        // than sticking to a pooled connection that goes on to serve a request. The value is
        // interpolated because SET does not take a bind parameter; it is truncated to an integer
        // rather than passed through as given.
        await trx.raw(`SET LOCAL statement_timeout = ${Math.trunc(this.statementTimeoutMs)}`);
      }

      return work(new TimescaleMetricIntervalRollupRepository(trx, this.statementTimeoutMs));
    });
  }

  /**
   * The span the raw metrics cover, taken from chunk metadata rather than the metrics table.
   *
   * A min/max over the hypertable carries no time predicate, so it cannot be chunk-excluded and
   * takes a lock on every chunk. At 232 chunks against a max_locks_per_transaction of 64 that
   * overruns the lock table whenever the server is busy enough that no other session is leaving
   * slack, and `out of shared memory` here fails the whole run rather than one interval. The
   * catalog carries each chunk's range without opening any of them.
   *
   * These are chunk boundaries rather than the first and last row, so the span runs at most one
   * chunk wider than the data. Only the start is read -- as the floor the backfill walks down to --
   * and reaching slightly past the oldest row costs one refresh that finds nothing to aggregate.
   */
  async getMetricsWindow(): Promise<MetricIntervalWindow | null> {
    const row = await this.knex('timescaledb_information.chunks')
      .where({ hypertable_name: 'metrics' })
      .min({ start: 'range_start' })
      .max({ end: 'range_end' })
      .first<RangeRow>();

    return row?.start && row?.end ? { start: new Date(row.start), end: new Date(row.end) } : null;
  }

  async getCoverage(interval: MetricInterval): Promise<MetricIntervalCoverage | null> {
    const row = await this.knex('metric_interval_rollup_coverage').where({ interval }).first<CoverageRow>();

    return row ? { interval, coveredFrom: new Date(row.covered_from), coveredTo: new Date(row.covered_to) } : null;
  }

  async refresh(
    interval: MetricInterval,
    bucket: string,
    source: MetricInterval | null,
    window: MetricIntervalWindow,
  ): Promise<number> {
    const { start, coveredTo } = await this.snapWindow(bucket, window);

    const result = source
      ? await this.refreshFromRollups(interval, bucket, source, start, window.end)
      : await this.refreshFromMetrics(interval, bucket, start, window.end);

    await this.extendCoverage(interval, start, coveredTo);

    return result?.rowCount ?? 0;
  }

  /**
   * Resolve both window edges to bucket boundaries before anything reads.
   *
   * time_bucket is immutable, but computing it inside a predicate still leaves the planner a
   * function call where it wants a constant. On the metrics hypertable that pushed chunk exclusion
   * to run time, which takes a lock on every chunk first and exhausted the lock table once history
   * had grown; on the rollups it made the bucket index unusable for a seek. Resolving both edges in
   * one round trip keeps Postgres' own bucketing semantics and hands the refresh plain timestamps.
   *
   * The start is snapped so a bucket straddling it is recomputed from all of its rows rather than
   * overwritten with a partial total. The end is snapped separately and only for coverage: the
   * refresh reads up to the raw end and cuts the open bucket off there, so coverage has to stop at
   * the last whole bucket or it advertises a short total as rolled up.
   */
  private async snapWindow(
    bucket: string,
    window: MetricIntervalWindow,
  ): Promise<{ start: Date; coveredTo: Date }> {
    const result = await this.knex.raw<{ rows: { start: Date; covered_to: Date }[] }>(
      'SELECT time_bucket(?::interval, ?::timestamptz) AS start, time_bucket(?::interval, ?::timestamptz) AS covered_to',
      [bucket, window.start, bucket, window.end],
    );

    const [row] = result.rows;
    return { start: new Date(row.start), coveredTo: new Date(row.covered_to) };
  }

  // The GROUP BY uses select-list ordinals because repeating the time_bucket expression would bind a
  // second placeholder that Postgres cannot match against the one in the select list.
  private async refreshFromMetrics(interval: MetricInterval, bucket: string, start: Date, end: Date) {
    return this.knex.raw(
      `INSERT INTO metric_interval_rollups
         ("interval", namespace, name, tenant, metric, bucket, sum, count, min, max, updated_at)
       SELECT ?, namespace, name, tenant, metric, time_bucket(?::interval, timestamp),
              SUM(value), COUNT(value), MIN(value), MAX(value), NOW()
       FROM metrics
       WHERE timestamp >= ? AND timestamp < ?
       GROUP BY 2, 3, 4, 5, 6
       ON CONFLICT ("interval", namespace, name, metric, bucket, (COALESCE(tenant, '')))
       DO UPDATE SET sum = EXCLUDED.sum, count = EXCLUDED.count, min = EXCLUDED.min,
                     max = EXCLUDED.max, updated_at = NOW()`,
      [interval, bucket, start, end],
    );
  }

  /**
   * Aggregate a coarser interval from a finer one already in the table.
   *
   * SUM of sums and SUM of counts give the coarse bucket's totals, and MIN/MAX of the finer
   * extremes give its extremes, so the result is identical to aggregating the raw rows -- provided
   * the finer buckets nest inside the coarse one, which the definitions guarantee.
   *
   * Reading and writing metric_interval_rollups in one statement is safe: the SELECT sees the
   * snapshot from before the INSERT, and the rows it reads carry the source interval while the rows
   * written carry the target, so a refresh can never consume its own output.
   */
  private async refreshFromRollups(
    interval: MetricInterval,
    bucket: string,
    source: MetricInterval,
    start: Date,
    end: Date,
  ) {
    return this.knex.raw(
      `INSERT INTO metric_interval_rollups
         ("interval", namespace, name, tenant, metric, bucket, sum, count, min, max, updated_at)
       SELECT ?, namespace, name, tenant, metric, time_bucket(?::interval, bucket),
              SUM(sum), SUM(count), MIN(min), MAX(max), NOW()
       FROM metric_interval_rollups
       WHERE "interval" = ? AND bucket >= ? AND bucket < ?
       GROUP BY 2, 3, 4, 5, 6
       ON CONFLICT ("interval", namespace, name, metric, bucket, (COALESCE(tenant, '')))
       DO UPDATE SET sum = EXCLUDED.sum, count = EXCLUDED.count, min = EXCLUDED.min,
                     max = EXCLUDED.max, updated_at = NOW()`,
      [interval, bucket, source, start, end],
    );
  }

  // Coverage describes whole buckets only, so it carries an exclusive end: every bucket starting
  // before covered_to is complete, and the open one falls back to the metrics_* views.
  private async extendCoverage(interval: MetricInterval, coveredFrom: Date, coveredTo: Date): Promise<void> {
    await this.knex.raw(
      `INSERT INTO metric_interval_rollup_coverage ("interval", covered_from, covered_to, updated_at)
       VALUES (?, ?, ?, NOW())
       ON CONFLICT ("interval") DO UPDATE SET
         covered_from = LEAST(metric_interval_rollup_coverage.covered_from, EXCLUDED.covered_from),
         covered_to = GREATEST(metric_interval_rollup_coverage.covered_to, EXCLUDED.covered_to),
         updated_at = NOW()`,
      [interval, coveredFrom, coveredTo],
    );
  }
}
