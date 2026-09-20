import { Knex } from 'knex';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  Value,
  ValueCriteria,
  ValuesRepository,
  MetricValue,
  Metric,
  MetricCriteria,
  MetricInterval,
  Page,
  PlatformMetric,
} from '../values';
import { AdspId } from '@abgov/adsp-service-sdk';
import { stripNul } from './sanitize';
import { getMetricIntervalDefinition } from '../values/metricIntervals';

type ValueRecord = Value & { namespace: string; name: string; tenant: string };

export class TimescaleValuesRepository implements ValuesRepository {
  constructor(
    private knex: Knex,
    private logger?: Logger,
  ) {}

  /**
   * Strip U+0000 before it reaches a text or jsonb column, where PostgreSQL cannot represent it.
   *
   * stripNul returns the same reference when nothing changed, so the warning fires only when a
   * payload was actually altered -- which is worth surfacing, since the stored value then differs
   * from what the publisher sent.
   */
  private sanitize<T>(namespace: string, name: string, value: T): T {
    const sanitized = stripNul(value);
    if (sanitized !== value) {
      this.logger?.warn(
        `Removed null characters from value ${namespace}:${name} before write; ` +
          'the stored value differs from what was submitted.',
        { context: 'TimescaleValuesRepository' },
      );
    }

    return sanitized;
  }

  async writeValues(
    namespace: string,
    name: string,
    tenantId: AdspId,
    values: Omit<Value, 'tenantId'>[],
  ): Promise<Value[]> {
    const records = await this.knex.transaction(async (ts) => {
      const rows = await ts<ValueRecord>('values')
        .insert(
          values.map(({ timestamp, correlationId, context, value }) => ({
            namespace,
            name,
            timestamp,
            tenant: tenantId?.toString(),
            correlationId: this.sanitize(namespace, name, correlationId),
            context: this.sanitize(namespace, name, context || {}),
            value: this.sanitize(namespace, name, value),
          })),
        )
        .returning('*');

      const metrics = values
        .filter(({ metrics }) => typeof metrics === 'object')
        .reduce((valueMetrics, { timestamp, metrics }) => {
          Object.entries(metrics).forEach(([metric, value]) => {
            if (typeof value === 'number') {
              valueMetrics.push({
                namespace,
                name,
                timestamp,
                metric,
                value,
              });
            }
          });

          return valueMetrics;
        }, [] as MetricValue[]);

      if (metrics.length > 0) {
        await this.writeMetricRecords(ts, tenantId, metrics);
      }

      return rows;
    });

    return records.map(({ timestamp, correlationId, tenant, context, value }) => ({
      timestamp,
      correlationId,
      tenantId: tenant ? AdspId.parse(tenant) : null,
      context,
      value,
    }));
  }

  async readValues(top = 10, after?: string, criteria?: ValueCriteria): Promise<Results<Value>> {
    const skip = decodeAfter(after);

    let query = this.knex<ValueRecord>('values');
    query = query.offset(skip).limit(top);

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};
      if (criteria.tenantId) {
        queryCriteria['tenant'] = criteria.tenantId.toString();
      }

      if (criteria.namespace) {
        queryCriteria['namespace'] = criteria.namespace;
      }

      if (criteria.name) {
        queryCriteria['name'] = criteria.name;
      }

      if (criteria.correlationId) {
        queryCriteria['correlationId'] = criteria.correlationId;
      }

      query.where(queryCriteria);

      if (criteria.timestampMax) {
        query = query.where('timestamp', '<=', criteria.timestampMax);
      }

      if (criteria.timestampMin) {
        query = query.where('timestamp', '>=', criteria.timestampMin);
      }

      if (criteria.context) {
        query.whereRaw(`context @> ?::jsonb`, [JSON.stringify(criteria.context)]);
      }

      if (criteria.value) {
        query.whereRaw(`value @> ?::jsonb`, [`{"payload": {"targetId": "${criteria.value}"}}`]);
      }

      if (criteria.url) {
        query.whereRaw(`value @> ?::jsonb`, [`{"payload": {"URL": "${criteria.url}"}}`]);
      }
    }

    const rows = await query.orderBy('timestamp', 'desc');
    const results: Value[] = rows.map((row) => ({
      timestamp: row.timestamp,
      correlationId: row.correlationId,
      tenantId: row.tenant ? AdspId.parse(row.tenant) : null,
      context: row.context,
      value: row.value,
    }));

    return {
      results,
      page: {
        after,
        next: encodeNext(results.length, top, skip),
        size: results.length,
      },
    };
  }

  async countValues(criteria: ValueCriteria): Promise<number> {
    let query = this.knex<ValueRecord>('values');

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};
      if (criteria.tenantId) {
        queryCriteria['tenant'] = criteria.tenantId.toString();
      }

      if (criteria.namespace) {
        queryCriteria['namespace'] = criteria.namespace;
      }

      if (criteria.name) {
        queryCriteria['name'] = criteria.name;
      }

      if (criteria.correlationId) {
        queryCriteria['correlationId'] = criteria.correlationId;
      }

      query.where(queryCriteria);

      if (criteria.timestampMax) {
        query = query.where('timestamp', '<=', criteria.timestampMax);
      }

      if (criteria.timestampMin) {
        query = query.where('timestamp', '>=', criteria.timestampMin);
      }

      if (criteria.context) {
        query.whereRaw(`context @> ?::jsonb`, [JSON.stringify(criteria.context)]);
      }
    }

    const [{ count }] = await query.count('*', { as: 'count' });
    return typeof count === 'string' ? parseInt(count) : count;
  }

  /**
   * Resolve the rollup coverage span and the effective end of the window in one round trip.
   *
   * `intervalMax` is snapped back to the start of the bucket it lands in, so the period still in
   * progress is left out and only whole ones are served. That is what lets coverage satisfy a read
   * reaching up to "now": a composed interval's rollup can never contain its own open bucket, so a
   * window asking for one could never be fully covered, and every such read fell back to a live
   * aggregate of the entire range.
   *
   * The snap goes through `time_bucket` rather than being computed here because `extendCoverage`
   * snaps `covered_to` with the same function. Both sides then describe a boundary the database
   * agrees on, which a calendar month (not a fixed width) and a week (whose origin is not midnight
   * Sunday) would otherwise make easy to get subtly wrong.
   */
  private async resolveMetricWindow(
    interval: MetricInterval,
    intervalMax: Date,
  ): Promise<{ coverage: { from: Date; to: Date } | null; intervalMax: Date }> {
    const { bucket } = getMetricIntervalDefinition(interval);

    const result = await this.knex.raw<{
      rows: { interval_max: Date; covered_from: Date | null; covered_to: Date | null }[];
    }>(
      `SELECT time_bucket(?::interval, ?::timestamptz) AS interval_max, c.covered_from, c.covered_to
       FROM (SELECT 1) AS anchor
       LEFT JOIN metric_interval_rollup_coverage c ON c."interval" = ?`,
      [bucket, intervalMax, interval],
    );

    const [row] = result.rows;

    return {
      intervalMax: new Date(row.interval_max),
      coverage:
        row.covered_from && row.covered_to
          ? { from: new Date(row.covered_from), to: new Date(row.covered_to) }
          : null,
    };
  }

  /**
   * Pick where interval data is read from.
   *
   * The rollup table only answers a request whose whole window it has rolled up; coverage is a
   * single contiguous span per interval, so a request reaching outside it falls back to a live
   * aggregate of the raw metrics table. That is slower, but always complete, which is what lets the
   * rollups be populated progressively without the API losing data in the meantime.
   *
   * With the window snapped to whole buckets that fallback is no longer the common case. It stays
   * reachable while the backfill is still walking history back, and for the few minutes after a
   * period closes before the job composes it, rather than on every read that ends at "now".
   */
  private async resolveMetricSource(
    interval: MetricInterval,
    namespace: string,
    name: string,
    tenantId: AdspId,
    criteria: MetricCriteria,
    metric?: string,
  ): Promise<{ table: string | Knex.QueryBuilder; rollup: boolean; intervalMax: Date }> {
    const { coverage, intervalMax } = await this.resolveMetricWindow(interval, criteria.intervalMax ?? new Date());
    const { intervalMin } = criteria;

    const covered = !!coverage && (!intervalMin || coverage.from <= intervalMin) && coverage.to >= intervalMax;

    return covered
      ? { table: 'metric_interval_rollups', rollup: true, intervalMax }
      : {
          table: this.rawMetricsQuery(interval, namespace, name, tenantId, { ...criteria, intervalMax }, metric),
          rollup: false,
          intervalMax,
        };
  }

  /**
   * Aggregate the raw metrics table live, for a window the rollups have not covered yet.
   *
   * The metrics_* views this replaced filtered on their derived `bucket` column instead of on
   * `timestamp`, which relies on Postgres inferring a `timestamp` range back out of a `time_bucket`
   * predicate to exclude chunks. That works for a fixed-width bucket (a minute, an hour, a day, a
   * week), but not for a calendar-width one -- a month is not a fixed number of seconds -- so a
   * `monthly` request without full coverage had no time bound applied at the database at all, and
   * aggregated every row ever recorded for the metric before the rest of the query could trim it
   * back down, hanging on any window reaching into the still-in-progress month. Filtering on
   * `timestamp` directly, before grouping, does not depend on that inference either way.
   *
   * `criteria.intervalMax` arrives snapped to a bucket boundary and only buckets starting before it
   * are served, so every row belonging to one of them falls before it too and the scan needs no
   * allowance past the bound.
   *
   * Deliberately synchronous. A knex builder is thenable, so returning one from an `async` function
   * hands it to the promise machinery, which executes the query and resolves to its rows instead --
   * the builder has to reach its caller by a plain return or wrapped in an object, never as a bare
   * awaited value.
   */
  private rawMetricsQuery(
    interval: MetricInterval,
    namespace: string,
    name: string,
    tenantId: AdspId,
    criteria: Pick<MetricCriteria, 'intervalMin' | 'intervalMax'>,
    metric?: string,
  ): Knex.QueryBuilder {
    const { bucket } = getMetricIntervalDefinition(interval);

    let query = this.knex('metrics').where({ namespace, name });
    if (tenantId) {
      query = query.where({ tenant: tenantId.toString() });
    }

    if (metric) {
      query = query.where({ metric });
    }

    if (criteria.intervalMin) {
      query = query.where('timestamp', '>=', criteria.intervalMin);
    }

    if (criteria.intervalMax) {
      query = query.where('timestamp', '<', criteria.intervalMax);
    }

    return query
      .select(
        'namespace',
        'name',
        'tenant',
        'metric',
        this.knex.raw('time_bucket(?::interval, timestamp) AS bucket', [bucket]),
        this.knex.raw('AVG(value) AS avg'),
        this.knex.raw('SUM(value) AS sum'),
        this.knex.raw('COUNT(value) AS count'),
        this.knex.raw('MIN(value) AS min'),
        this.knex.raw('MAX(value) AS max'),
      )
      .groupBy('namespace', 'name', 'tenant', 'metric', 'bucket')
      .as('raw_metrics_agg');
  }

  /**
   * The rollups deliberately store sum and count rather than avg, since an average of averages is
   * not the average. Divide on read so both sources return the same shape.
   */
  private selectAverage(rollup: boolean) {
    return rollup ? this.knex.raw('CASE WHEN count > 0 THEN sum / count ELSE NULL END as avg') : 'avg';
  }

  async readMetrics(
    tenantId: AdspId,
    namespace: string,
    name: string,
    top = 100,
    after?: string,
    criteria?: MetricCriteria,
  ): Promise<Record<string, Metric> & { page: Page }> {
    const skip = decodeAfter(after);

    // Default interval: last 1 month if not provided - prevents infinitely long search
    if (!criteria.intervalMin && !criteria.intervalMax) {
      const now = new Date();
      criteria.intervalMax = now;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      criteria.intervalMin = oneMonthAgo;
    }

    switch (criteria.interval) {
      case 'one_minute':
      case 'five_minutes':
      case 'hourly':
      case 'daily':
      case 'weekly':
      case 'monthly':
        break;
      default:
        throw new InvalidOperationError('Interval value is not recognized.');
    }

    const { table, rollup, intervalMax } = await this.resolveMetricSource(
      criteria.interval,
      namespace,
      name,
      tenantId,
      criteria,
    );

    const queryCriteria = {
      namespace,
      name,
    };

    if (tenantId) {
      queryCriteria['tenant'] = tenantId.toString();
    }

    let query = this.knex(table)
      .offset(skip)
      .limit(top)
      .select('metric', 'bucket', 'sum', 'min', 'max', 'count', this.selectAverage(rollup))
      .where(queryCriteria);

    if (rollup) {
      query = query.where({ interval: criteria.interval });
    }

    // Snapped to a bucket boundary and exclusive, so the period still in progress is left out: a
    // partial total is not comparable with the whole ones beside it, and asking only for whole ones
    // is what keeps the window inside what coverage can satisfy.
    query = query.where('bucket', '<', intervalMax);

    if (criteria.intervalMin) {
      query = query.where('bucket', '>=', criteria.intervalMin);
    }

    if (criteria.metricLike) {
      query = query.where('metric', 'like', `%${criteria.metricLike}%`);
    }

    const rows = await query.orderBy('bucket', 'desc');
    return rows.reduce(
      (metrics, row) => {
        const metric = metrics[row.metric] || { name: row.metric, values: [] };
        metric.values.push({
          interval: new Date(row.bucket),
          sum: row.sum,
          avg: row.avg,
          min: row.min,
          max: row.max,
          count: row.count,
        });

        return {
          ...metrics,
          [row.metric]: metric,
        };
      },
      {
        page: {
          after,
          next: encodeNext(rows.length, top, skip),
          size: rows.length,
          intervalMax,
        },
      },
    );
  }

  async readMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    top = 100,
    after?: string,
    criteria?: MetricCriteria,
  ): Promise<Metric & { page: Page }> {
    const skip = decodeAfter(after);

    // Default interval: last 1 month if not provided - prevents infinitely long search
    if (!criteria.intervalMin && !criteria.intervalMax) {
      const now = new Date();
      criteria.intervalMax = now;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      criteria.intervalMin = oneMonthAgo;
    }

    switch (criteria.interval) {
      case 'hourly':
      case 'daily':
      case 'weekly':
      case 'monthly':
        break;
      default:
        throw new InvalidOperationError('Interval value is not recognized.');
    }

    const { table, rollup, intervalMax } = await this.resolveMetricSource(
      criteria.interval,
      namespace,
      name,
      tenantId,
      criteria,
      metric,
    );

    const queryCriteria = {
      namespace,
      name,
      metric,
    };

    if (tenantId) {
      queryCriteria['tenant'] = tenantId.toString();
    }

    let query = this.knex(table)
      .offset(skip)
      .limit(top)
      .select('bucket', 'sum', 'min', 'max', 'count', this.selectAverage(rollup))
      .where(queryCriteria);

    if (rollup) {
      query = query.where({ interval: criteria.interval });
    }

    // Snapped to a bucket boundary and exclusive, so the period still in progress is left out: a
    // partial total is not comparable with the whole ones beside it, and asking only for whole ones
    // is what keeps the window inside what coverage can satisfy.
    query = query.where('bucket', '<', intervalMax);

    if (criteria.intervalMin) {
      query = query.where('bucket', '>=', criteria.intervalMin);
    }

    const rows = await query.orderBy('bucket', 'desc');
    return {
      name: metric,
      values: rows.map((row) => ({
        interval: new Date(row.bucket),
        sum: row.sum,
        avg: row.avg,
        min: row.min,
        max: row.max,
        count: row.count,
      })),
      page: {
        after,
        next: encodeNext(rows.length, top, skip),
        size: rows.length,
        intervalMax,
      },
    };
  }

  /**
   * Platform-scoped metrics always read the materialised rollups, never the per-tenant metrics_*
   * views: those views require a tenant filter, and re-aggregating them across every tenant on read
   * would be prohibitively expensive at platform scale. Coverage catches up on its own schedule, so
   * a window outside it simply returns fewer rows rather than falling back like the tenant-scoped
   * reads do.
   */
  async readPlatformMetrics(
    namespace: string,
    name: string,
    criteria?: MetricCriteria,
  ): Promise<Record<string, PlatformMetric>> {
    // Default interval: last 1 month if not provided - prevents infinitely long search
    if (!criteria.intervalMin && !criteria.intervalMax) {
      const now = new Date();
      criteria.intervalMax = now;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      criteria.intervalMin = oneMonthAgo;
    }

    switch (criteria.interval) {
      case 'one_minute':
      case 'five_minutes':
      case 'hourly':
      case 'daily':
      case 'weekly':
      case 'monthly':
        break;
      default:
        throw new InvalidOperationError('Interval value is not recognized.');
    }

    const { intervalMax } = await this.resolveMetricWindow(criteria.interval, criteria.intervalMax ?? new Date());

    let query = this.knex('metric_interval_rollups')
      .select('metric', 'bucket', 'sum', 'min', 'max', 'count', this.selectAverage(true), 'tenant')
      .where({ namespace, name, interval: criteria.interval });

    // Snapped to a bucket boundary and exclusive, so the period still in progress is left out: a
    // partial total is not comparable with the whole ones beside it, and asking only for whole ones
    // is what keeps the window inside what coverage can satisfy.
    query = query.where('bucket', '<', intervalMax);

    if (criteria.intervalMin) {
      query = query.where('bucket', '>=', criteria.intervalMin);
    }

    if (criteria.metricLike) {
      query = query.where('metric', 'like', `%${criteria.metricLike}%`);
    }

    const rows = await query.orderBy('bucket', 'desc');
    return rows.reduce(
      (metrics, row) => {
        const metric = metrics[row.metric] || { name: row.metric, values: [] };
        metric.values.push({
          interval: new Date(row.bucket),
          sum: row.sum,
          avg: row.avg,
          min: row.min,
          max: row.max,
          count: row.count,
          tenantId: row.tenant,
        });

        return {
          ...metrics,
          [row.metric]: metric,
        };
      },
      {} as Record<string, PlatformMetric>,
    );
  }

  async writeMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    timestamp: Date,
    value: number,
  ): Promise<MetricValue> {
    return await this.knex.transaction(async (ts) => {
      const [result] = await this.writeMetricRecords(ts, tenantId, [{ namespace, name, timestamp, metric, value }]);
      return result;
    });
  }

  private async writeMetricRecords(
    transaction: Knex.Transaction,
    tenantId: AdspId,
    metrics: MetricValue[],
  ): Promise<MetricValue[]> {
    const rows = await transaction<MetricValue & { tenant: string }>('metrics')
      .insert(
        metrics.map(({ namespace, name, timestamp, metric, value }) => ({
          namespace,
          name,
          tenant: tenantId?.toString(),
          metric: this.sanitize(namespace, name, metric),
          timestamp,
          value,
        })),
      )
      .returning('*');

    return rows.map(({ namespace, name, metric, timestamp, value }) => ({
      namespace,
      name,
      metric,
      timestamp,
      value,
    }));
  }
}
