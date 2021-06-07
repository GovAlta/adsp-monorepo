import * as Knex from 'knex';
import { InvalidOperationError } from '@core-services/core-common';
import {
  Value,
  ValueCriteria,
  ValueDefinitionEntity,
  ValuesRepository,
  MetricValue,
  Metric,
  MetricCriteria,
} from '../values';
import { AdspId } from '@abgov/adsp-service-sdk';

type ValueRecord = Value & { namespace: string; name: string; tenant: string };

export class TimescaleValuesRepository implements ValuesRepository {
  constructor(private knex: Knex) {}

  async writeValue(tenantId: AdspId, definition: ValueDefinitionEntity, value: Value): Promise<Value> {
    const [row] = await this.knex<ValueRecord>('values')
      .insert({
        namespace: definition.namespace.name,
        name: definition.name,
        timestamp: value.timestamp,
        tenant: tenantId?.toString(),
        correlationId: value.correlationId,
        context: value.context || {},
        value: value.value,
      })
      .returning('*');

    return {
      timestamp: row.timestamp,
      correlationId: row.correlationId,
      context: row.context,
      value: row.value,
    };
  }

  async readValues(tenantId: AdspId, namespace: string, name: string, criteria: ValueCriteria): Promise<Value[]> {
    const queryCriteria = {
      namespace,
      name,
    };

    if (tenantId) {
      queryCriteria['tenant'] = tenantId.toString();
    }

    let query = this.knex<ValueRecord>('values').where(queryCriteria);

    if (criteria.top) {
      query = query.limit(criteria.top);
    } else {
      query = query.limit(100);
    }

    if (criteria.timestampMax) {
      query = query.where('timestamp', '<=', criteria.timestampMax);
    }

    if (criteria.timestampMin) {
      query = query.where('timestamp', '>=', criteria.timestampMin);
    }

    const rows = await query.orderBy('timestamp', 'desc');
    return rows.map((row) => ({
      timestamp: row.timestamp,
      correlationId: row.correlationId,
      tenantId: row.tenant,
      context: row.context,
      value: row.value,
    }));
  }

  readMetric(
    tenantId: AdspId,
    definition: ValueDefinitionEntity,
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
      namespace: definition.namespace.name,
      name: definition.name,
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
    definition: ValueDefinitionEntity,
    metric: string,
    timestamp: Date,
    value: number
  ): Promise<MetricValue> {
    const [row] = await this.knex<MetricValue & { tenant: string }>('metrics')
      .insert({
        namespace: definition.namespace.name,
        name: definition.name,
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
