import { Knex } from 'knex';
import { MetricInterval, MetricIntervalCoverage, MetricIntervalWindow } from '../types';

export interface MetricIntervalRollupRepository {
  getMetricsWindow(): Promise<MetricIntervalWindow | null>;
  getCoverage(interval: MetricInterval): Promise<MetricIntervalCoverage | null>;
  // Callers must pass a window that touches or overlaps existing coverage; coverage is stored as a
  // single span, so a detached window would report the gap between them as rolled up.
  refresh(interval: MetricInterval, bucket: string, window: MetricIntervalWindow): Promise<number>;
}

type RangeRow = {
  start?: Date | string | null;
  end?: Date | string | null;
};

type CoverageRow = {
  covered_from: Date | string;
  covered_to: Date | string;
};

export class TimescaleMetricIntervalRollupRepository implements MetricIntervalRollupRepository {
  constructor(private knex: Knex) {}

  async getMetricsWindow(): Promise<MetricIntervalWindow | null> {
    const row = await this.knex('metrics').min({ start: 'timestamp' }).max({ end: 'timestamp' }).first<RangeRow>();

    return row?.start && row?.end ? { start: new Date(row.start), end: new Date(row.end) } : null;
  }

  async getCoverage(interval: MetricInterval): Promise<MetricIntervalCoverage | null> {
    const row = await this.knex('metric_interval_rollup_coverage').where({ interval }).first<CoverageRow>();

    return row ? { interval, coveredFrom: new Date(row.covered_from), coveredTo: new Date(row.covered_to) } : null;
  }

  async refresh(interval: MetricInterval, bucket: string, window: MetricIntervalWindow): Promise<number> {
    // The window start is snapped down to a bucket boundary so a bucket straddling it is recomputed
    // from all of its rows rather than being overwritten with a partial total. The GROUP BY uses
    // select-list ordinals because repeating the time_bucket expression would bind a second
    // placeholder that Postgres cannot match against the one in the select list.
    const result = await this.knex.raw(
      `INSERT INTO metric_interval_rollups
         ("interval", namespace, name, tenant, metric, bucket, sum, count, min, max, updated_at)
       SELECT ?, namespace, name, tenant, metric, time_bucket(?::interval, timestamp),
              SUM(value), COUNT(value), MIN(value), MAX(value), NOW()
       FROM metrics
       WHERE timestamp >= time_bucket(?::interval, ?::timestamptz) AND timestamp < ?
       GROUP BY 2, 3, 4, 5, 6
       ON CONFLICT ("interval", namespace, name, metric, bucket, (COALESCE(tenant, '')))
       DO UPDATE SET sum = EXCLUDED.sum, count = EXCLUDED.count, min = EXCLUDED.min,
                     max = EXCLUDED.max, updated_at = NOW()`,
      [interval, bucket, bucket, window.start, window.end],
    );

    await this.extendCoverage(interval, bucket, window);

    return result?.rowCount ?? 0;
  }

  private async extendCoverage(interval: MetricInterval, bucket: string, window: MetricIntervalWindow): Promise<void> {
    await this.knex.raw(
      `INSERT INTO metric_interval_rollup_coverage ("interval", covered_from, covered_to, updated_at)
       VALUES (?, time_bucket(?::interval, ?::timestamptz), ?, NOW())
       ON CONFLICT ("interval") DO UPDATE SET
         covered_from = LEAST(metric_interval_rollup_coverage.covered_from, EXCLUDED.covered_from),
         covered_to = GREATEST(metric_interval_rollup_coverage.covered_to, EXCLUDED.covered_to),
         updated_at = NOW()`,
      [interval, bucket, window.start, window.end],
    );
  }
}
