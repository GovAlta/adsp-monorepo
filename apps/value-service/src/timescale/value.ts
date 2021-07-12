import * as Knex from 'knex';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Value, ValueCriteria, ValuesRepository, MetricValue, Metric, MetricCriteria } from '../values';
import { AdspId } from '@abgov/adsp-service-sdk';

type ValueRecord = Value & { namespace: string; name: string; tenant: string };

export class TimescaleValuesRepository implements ValuesRepository {
  constructor(private knex: Knex) {}

  async writeValue(namespace: string, name: string, tenantId: AdspId, value: Omit<Value, 'tenantId'>): Promise<Value> {
    const [row] = await this.knex<ValueRecord>('values')
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
          await this.writeMetric(tenantId, namespace, name, key, value.timestamp, metric);
        }
      }
    }

    return {
      timestamp: row.timestamp,
      correlationId: row.correlationId,
      tenantId: row.tenant ? AdspId.parse(row.tenant) : null,
      context: row.context,
      value: row.value,
    };
  }

  async readValues(top = 10, after?: string, criteria?: ValueCriteria): Promise<Results<Value>> {
    const skip = decodeAfter(after);

    let query = this.knex<ValueRecord>('values');
    query = query.offset(skip).limit(top);

    if (criteria) {
      const queryCriteria = {};
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
        query.whereRaw(`context @> '?'::jsonb`, [JSON.stringify(criteria.context)]);
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

  async readMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    criteria: MetricCriteria
  ): Promise<Metric> {
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

    let query = this.knex(view).select('bucket', 'sum', 'avg', 'min', 'max').where(queryCriteria);

    if (criteria.intervalMax) {
      query = query.where('bucket', '<=', criteria.intervalMax);
    }

    if (criteria.intervalMin) {
      query = query.where('bucket', '>=', criteria.intervalMin);
    }

    return query.then((rows) => ({
      name: metric,
      values: rows.map((row) => ({
        interval: new Date(row.bucket),
        sum: row.sum,
        avg: row.avg,
        min: row.min,
        max: row.max,
      })),
    }));
  }

  async writeMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    timestamp: Date,
    value: number
  ): Promise<MetricValue> {
    const [row] = await this.knex<MetricValue & { tenant: string }>('metrics')
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
