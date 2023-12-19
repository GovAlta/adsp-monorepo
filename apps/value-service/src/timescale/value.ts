import { Knex } from 'knex';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Value, ValueCriteria, ValuesRepository, MetricValue, Metric, MetricCriteria, Page } from '../values';
import { AdspId } from '@abgov/adsp-service-sdk';

type ValueRecord = Value & { namespace: string; name: string; tenant: string };

export class TimescaleValuesRepository implements ValuesRepository {
  constructor(private knex: Knex) {}

  async writeValue(namespace: string, name: string, tenantId: AdspId, value: Omit<Value, 'tenantId'>): Promise<Value> {
    const record = await this.knex.transaction(async (ts) => {
      const [row] = await ts<ValueRecord>('values')
        .insert({
          namespace,
          name,
          timestamp: value.timestamp,
          tenant: tenantId?.toString(),
          correlationId: value.correlationId,
          context: value.context || {},
          value: value.value,
        })
        .returning('*');

      if (value.metrics) {
        const keys = Object.keys(value.metrics);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const metric = value.metrics[key];
          if (typeof metric === 'number') {
            await this.writeMetricRecord(ts, tenantId, namespace, name, key, value.timestamp, metric);
          }
        }
      }

      return row;
    });

    return {
      timestamp: record.timestamp,
      correlationId: record.correlationId,
      tenantId: record.tenant ? AdspId.parse(record.tenant) : null,
      context: record.context,
      value: record.value,
    };
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

  async readMetrics(
    tenantId: AdspId,
    namespace: string,
    name: string,
    top = 100,
    after?: string,
    criteria?: MetricCriteria
  ): Promise<Record<string, Metric> & { page: Page }> {
    const skip = decodeAfter(after);

    let view = null;
    switch (criteria.interval) {
      case 'one_minute':
      case 'five_minutes':
      case 'hourly':
      case 'daily':
      case 'weekly':
        view = `metrics_${criteria.interval}`;
        break;
      default:
        throw new InvalidOperationError('Interval value is not recognized.');
    }

    const queryCriteria = {
      namespace,
      name,
    };

    if (tenantId) {
      queryCriteria['tenant'] = tenantId.toString();
    }

    let query = this.knex(view)
      .offset(skip)
      .limit(top)
      .select('metric', 'bucket', 'sum', 'avg', 'min', 'max', 'count')
      .where(queryCriteria);

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
      }
    );
  }

  async readMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    top = 100,
    after?: string,
    criteria?: MetricCriteria
  ): Promise<Metric & { page: Page }> {
    const skip = decodeAfter(after);

    let view = null;
    switch (criteria.interval) {
      case 'hourly':
      case 'daily':
      case 'weekly':
        view = `metrics_${criteria.interval}`;
        break;
      default:
        throw new InvalidOperationError('Interval value is not recognized.');
    }

    const queryCriteria = {
      namespace,
      name,
      metric,
    };

    if (tenantId) {
      queryCriteria['tenant'] = tenantId.toString();
    }

    let query = this.knex(view)
      .offset(skip)
      .limit(top)
      .select('bucket', 'sum', 'avg', 'min', 'max', 'count')
      .where(queryCriteria);

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

  async writeMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    timestamp: Date,
    value: number
  ): Promise<MetricValue> {
    return await this.knex.transaction((ts) =>
      this.writeMetricRecord(ts, tenantId, namespace, name, metric, timestamp, value)
    );
  }

  private async writeMetricRecord(
    transaction: Knex.Transaction,
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    timestamp: Date,
    value: number
  ): Promise<MetricValue> {
    const [row] = await transaction<MetricValue & { tenant: string }>('metrics')
      .insert({
        namespace,
        name,
        tenant: tenantId?.toString(),
        metric,
        timestamp,
        value: value,
      })
      .returning('*');

    return {
      namespace: row.namespace,
      name: row.name,
      metric: row.metric,
      timestamp: row.timestamp,
      value: row.value,
    };
  }
}
