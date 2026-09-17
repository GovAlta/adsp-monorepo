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

  private async getRollupCoverage(interval: MetricInterval): Promise<{ from: Date; to: Date } | null> {
    const row = await this.knex('metric_interval_rollup_coverage').where({ interval }).first();
    return row ? { from: new Date(row.covered_from), to: new Date(row.covered_to) } : null;
  }

  /**
   * Pick where interval data is read from.
   *
   * The rollup table only answers a request whose whole window it has rolled up; coverage is a
   * single contiguous span per interval, so a request reaching outside it falls back to a live
   * aggregate of the raw metrics table. That is slower, but always complete, which is what lets the
   * rollups be populated progressively without the API losing data in the meantime.
   *
   * A composed interval's own rollup can never cover its current, still-open period -- a month is
   * not rolled up until it is over -- so a window ending at "now" always misses on the trailing edge.
   * Falling all the way back to raw metrics for the whole window then re-pays the cost of however
   * much of it the rollup already had ready. `composeTrailingGap` borrows the source interval's own
   * rollup for that gap instead, and only falling back further when that has nothing to offer either.
   *
   * `computeAverage` tells the caller whether the table's average has to be derived from sum/count
   * (a rollup-shaped table never stores one) or can be read directly (the plain live aggregate
   * computes a true average of the raw rows, which is numerically the same thing).
   */
  private async resolveMetricSource(
    interval: MetricInterval,
    namespace: string,
    name: string,
    tenantId: AdspId,
    criteria: MetricCriteria,
    metric?: string,
  ): Promise<{ table: string | Knex.QueryBuilder; rollup: boolean; computeAverage: boolean }> {
    const coverage = await this.getRollupCoverage(interval);
    const { intervalMin, intervalMax } = criteria;

    const covered =
      !!coverage && (!intervalMin || coverage.from <= intervalMin) && (!intervalMax || coverage.to >= intervalMax);

    if (covered) {
      return { table: 'metric_interval_rollups', rollup: true, computeAverage: true };
    }

    const composed = await this.composeTrailingGap(interval, namespace, name, tenantId, criteria, metric, coverage);
    if (composed) {
      return { table: composed.as('composed_metric_source'), rollup: false, computeAverage: true };
    }

    return {
      table: this.rawMetricsQuery(interval, namespace, name, tenantId, criteria, metric).as('raw_metrics_agg'),
      rollup: false,
      computeAverage: false,
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
   * `omitAverage` drops the AVG column so the result matches the shape a rollup-sourced part
   * produces (sum/count, no stored average). Every arm of a UNION has to return the same columns,
   * and `mergeMetricSourceParts` recomputes the average from the merged sum/count anyway -- an
   * average of averages across parts that share a bucket would be wrong regardless.
   */
  private rawMetricsQuery(
    interval: MetricInterval,
    namespace: string,
    name: string,
    tenantId: AdspId,
    criteria: Pick<MetricCriteria, 'intervalMin' | 'intervalMax'>,
    metric?: string,
    omitAverage = false,
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
      // A bucket starting at or before intervalMax can still hold rows up to one bucket width past
      // it, so the scan has to reach that far or it drops the tail of that bucket. The caller trims
      // back to the exact window afterward by filtering on the bucket this computes.
      query = query.where(
        'timestamp',
        '<',
        this.knex.raw('?::timestamptz + ?::interval', [criteria.intervalMax, bucket]),
      );
    }

    return query
      .select(
        'namespace',
        'name',
        'tenant',
        'metric',
        this.knex.raw('time_bucket(?::interval, timestamp) AS bucket', [bucket]),
        ...(omitAverage ? [] : [this.knex.raw('AVG(value) AS avg')]),
        this.knex.raw('SUM(value) AS sum'),
        this.knex.raw('COUNT(value) AS count'),
        this.knex.raw('MIN(value) AS min'),
        this.knex.raw('MAX(value) AS max'),
      )
      .groupBy('namespace', 'name', 'tenant', 'metric', 'bucket');
  }

  /**
   * Read a range of one interval's own rollup rows, optionally re-bucketed to a coarser interval's
   * width.
   *
   * Re-bucketing runs the same sum-of-sums, min/max-of-extremes aggregation the rollup job itself
   * uses to compose one interval from a finer one (`refreshFromRollups` in
   * `TimescaleMetricIntervalRollupRepository`); the difference is this reads it live instead of
   * writing the result back, for a tail the coarser interval's own rollup has not reached yet.
   */
  private rollupRangeQuery(
    interval: MetricInterval,
    namespace: string,
    name: string,
    tenantId: AdspId,
    metric: string | undefined,
    from: Date,
    to: Date,
    asBucket?: string,
  ): Knex.QueryBuilder {
    let query = this.knex('metric_interval_rollups').where({ namespace, name, interval });

    if (tenantId) {
      query = query.where({ tenant: tenantId.toString() });
    }

    if (metric) {
      query = query.where({ metric });
    }

    query = query.where('bucket', '>=', from).where('bucket', '<', to);

    return asBucket
      ? query
          .select(
            'namespace',
            'name',
            'tenant',
            'metric',
            this.knex.raw('time_bucket(?::interval, bucket) AS bucket', [asBucket]),
            this.knex.raw('SUM(sum) AS sum'),
            this.knex.raw('SUM(count) AS count'),
            this.knex.raw('MIN(min) AS min'),
            this.knex.raw('MAX(max) AS max'),
          )
          .groupBy('namespace', 'name', 'tenant', 'metric', 'bucket')
      : query.select('namespace', 'name', 'tenant', 'metric', 'bucket', 'sum', 'count', 'min', 'max');
  }

  /**
   * Combine time-disjoint parts of one composed read into a single result.
   *
   * The parts partition the requested window by source, but the interval's current, still-open
   * bucket can carry a partial contribution from more than one part -- the borrowed source rollup up
   * to where it is covered, and raw metrics for whatever sliver isn't -- so the merge re-aggregates
   * by bucket instead of concatenating.
   */
  private mergeMetricSourceParts(parts: Knex.QueryBuilder[]): Knex.QueryBuilder {
    const [first, ...rest] = parts;
    const union = rest.length > 0 ? first.unionAll(rest, true) : first;

    return this.knex(union.as('metric_source_parts'))
      .select(
        'namespace',
        'name',
        'tenant',
        'metric',
        'bucket',
        this.knex.raw('SUM(sum) AS sum'),
        this.knex.raw('SUM(count) AS count'),
        this.knex.raw('MIN(min) AS min'),
        this.knex.raw('MAX(max) AS max'),
      )
      .groupBy('namespace', 'name', 'tenant', 'metric', 'bucket');
  }

  /**
   * Borrow the source interval's rollup for the tail past this interval's own coverage.
   *
   * Rollups run finest-first every five minutes, so by the time a composed interval's own coverage
   * stalls at its current, still-open period, its source has usually already caught up to "now" (or
   * close to it) on its own coverage. Reading that source's already-aggregated rows for the gap --
   * re-bucketed up to this interval's width -- costs a handful of rollup rows instead of a live scan
   * of the raw metrics table. Only whatever the source itself has not reached yet needs a live raw
   * aggregate, and that is bounded to a slice of one bucket rather than the whole requested window.
   *
   * Returns null when there is nothing to borrow from: no source (this is already the finest
   * interval), no coverage at all yet, or the window also reaches further back than what is covered.
   * That last case would need the same treatment on the leading edge, which does not arise from a
   * request reaching into "now" and is not worth the added complexity here -- it is transient (it
   * closes for good once the initial backfill finishes) where the trailing gap is permanent.
   */
  private async composeTrailingGap(
    interval: MetricInterval,
    namespace: string,
    name: string,
    tenantId: AdspId,
    criteria: MetricCriteria,
    metric: string | undefined,
    coverage: { from: Date; to: Date } | null,
  ): Promise<Knex.QueryBuilder | null> {
    const definition = getMetricIntervalDefinition(interval);
    const { intervalMin, intervalMax } = criteria;

    if (!definition.source || !intervalMax || !coverage || coverage.to >= intervalMax) {
      return null;
    }

    if (intervalMin && coverage.from > intervalMin) {
      return null;
    }

    const parts = [
      this.rollupRangeQuery(interval, namespace, name, tenantId, metric, intervalMin ?? coverage.from, coverage.to),
    ];

    const sourceCoverage = await this.getRollupCoverage(definition.source);
    const sourceCoveredTo = sourceCoverage && sourceCoverage.to > coverage.to ? sourceCoverage.to : coverage.to;
    const composedTo = sourceCoveredTo < intervalMax ? sourceCoveredTo : intervalMax;

    if (composedTo > coverage.to) {
      parts.push(
        this.rollupRangeQuery(
          definition.source,
          namespace,
          name,
          tenantId,
          metric,
          coverage.to,
          composedTo,
          definition.bucket,
        ),
      );
    }

    if (composedTo < intervalMax) {
      parts.push(
        this.rawMetricsQuery(
          interval,
          namespace,
          name,
          tenantId,
          { intervalMin: composedTo, intervalMax },
          metric,
          true,
        ),
      );
    }

    return this.mergeMetricSourceParts(parts);
  }

  /**
   * The rollups deliberately store sum and count rather than avg, since an average of averages is
   * not the average. Divide on read so both sources return the same shape.
   */
  private selectAverage(computeAverage: boolean) {
    return computeAverage ? this.knex.raw('CASE WHEN count > 0 THEN sum / count ELSE NULL END as avg') : 'avg';
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

    const { table, rollup, computeAverage } = await this.resolveMetricSource(
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
      .select('metric', 'bucket', 'sum', 'min', 'max', 'count', this.selectAverage(computeAverage))
      .where(queryCriteria);

    if (rollup) {
      query = query.where({ interval: criteria.interval });
    }

    if (criteria.intervalMax) {
      query = query.where('bucket', '<=', criteria.intervalMax);
    }

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

    const { table, rollup, computeAverage } = await this.resolveMetricSource(
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
      .select('bucket', 'sum', 'min', 'max', 'count', this.selectAverage(computeAverage))
      .where(queryCriteria);

    if (rollup) {
      query = query.where({ interval: criteria.interval });
    }

    if (criteria.intervalMax) {
      query = query.where('bucket', '<=', criteria.intervalMax);
    }

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

    let query = this.knex('metric_interval_rollups')
      .select('metric', 'bucket', 'sum', 'min', 'max', 'count', this.selectAverage(true), 'tenant')
      .where({ namespace, name, interval: criteria.interval });

    if (criteria.intervalMax) {
      query = query.where('bucket', '<=', criteria.intervalMax);
    }

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
