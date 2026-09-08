import { Knex } from 'knex';
import {
  EventCountRollupSource,
  MetricRollupSource,
  RollupDateRange,
  ServiceMetricRollup,
  ServiceMetricRollupMapping,
} from '../types';

export interface TenantServiceKey {
  tenant: string;
  service: string;
}

export interface ServiceMetricRollupCriteria {
  tenant?: string;
}

export interface ServiceMetricRollupRepository {
  hasRollups(): Promise<boolean>;
  getHistoricalRollupRange(mappings: ServiceMetricRollupMapping[]): Promise<RollupDateRange | null>;
  getKnownTenantServices(
    mappings: ServiceMetricRollupMapping[],
    criteria?: ServiceMetricRollupCriteria
  ): Promise<TenantServiceKey[]>;
  readRollup(day: Date, tenant: string, mapping: ServiceMetricRollupMapping): Promise<ServiceMetricRollup>;
  upsertRollups(rollups: ServiceMetricRollup[]): Promise<void>;
}

type AggregateRow = {
  sum?: string | number | null;
  count?: string | number | null;
  max?: string | number | null;
};

type RangeRow = {
  start?: Date | string | null;
  end?: Date | string | null;
};

const EVENT_LOG_NAMESPACE = 'event-service';
const EVENT_LOG_NAME = 'event';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class TimescaleServiceMetricRollupRepository implements ServiceMetricRollupRepository {
  constructor(private knex: Knex) {}

  async hasRollups(): Promise<boolean> {
    const row = await this.knex('service_metric_rollups').first('day');
    return !!row;
  }

  async getHistoricalRollupRange(mappings: ServiceMetricRollupMapping[]): Promise<RollupDateRange | null> {
    const metricSources = mappings.flatMap((mapping) => this.getMetricSources(mapping));
    const row = await this.applyMetricSourceFilter(this.knex('metrics'), metricSources)
      .min({ start: 'timestamp' })
      .max({ end: 'timestamp' })
      .first<RangeRow>();

    if (!row?.start || !row?.end) {
      return null;
    }

    const start = this.toStartOfUtcDay(new Date(row.start));
    const end = this.toStartOfUtcDay(new Date(row.end));
    const lastCompletedDay = this.toStartOfUtcDay(new Date(Date.now() - MS_PER_DAY));

    return start > lastCompletedDay
      ? null
      : {
          start,
          end: end > lastCompletedDay ? lastCompletedDay : end,
        };
  }

  async getKnownTenantServices(
    mappings: ServiceMetricRollupMapping[],
    criteria?: ServiceMetricRollupCriteria
  ): Promise<TenantServiceKey[]> {
    const keys = await Promise.all(
      mappings.map(async (mapping) => {
        const metricSources = this.getMetricSources(mapping);
        let query = this.applyMetricSourceFilter(this.knex('metrics'), metricSources).whereNotNull('tenant');

        if (criteria?.tenant) {
          query = query.where({ tenant: criteria.tenant });
        }

        const rows = await query.distinct<{ tenant: string }[]>('tenant');

        return rows.map(({ tenant }) => ({ tenant, service: mapping.service }));
      })
    );

    const uniqueKeys = new Map<string, TenantServiceKey>();
    keys.flat().forEach((key) => uniqueKeys.set(`${key.tenant}:${key.service}`, key));

    return [...uniqueKeys.values()];
  }

  async readRollup(day: Date, tenant: string, mapping: ServiceMetricRollupMapping): Promise<ServiceMetricRollup> {
    const [initiated, succeeded, failureEvents, duration, distinctResources] = await Promise.all([
      this.readCount(day, tenant, mapping.initiated),
      this.readCount(day, tenant, mapping.succeeded),
      this.readCount(day, tenant, mapping.failure_events),
      this.readDuration(day, tenant, mapping.duration),
      this.readDistinctResources(day, tenant, mapping),
    ]);

    return {
      day,
      tenant,
      service: mapping.service,
      initiated,
      succeeded,
      failure_events: failureEvents,
      unreconciled: initiated === null || succeeded === null ? null : Math.max(initiated - succeeded, 0),
      duration_sum: duration?.sum ?? null,
      duration_count: duration?.count ?? null,
      duration_max: duration?.max ?? null,
      distinct_resources: distinctResources,
    };
  }

  async upsertRollups(rollups: ServiceMetricRollup[]): Promise<void> {
    if (rollups.length === 0) {
      return;
    }

    await this.knex('service_metric_rollups')
      .insert(
        rollups.map((rollup) => ({
          ...rollup,
          day: this.formatDay(rollup.day),
          updated_at: this.knex.fn.now(),
        }))
      )
      .onConflict(['day', 'tenant', 'service'])
      .merge([
        'initiated',
        'succeeded',
        'failure_events',
        'unreconciled',
        'duration_sum',
        'duration_count',
        'duration_max',
        'distinct_resources',
        'updated_at',
      ]);
  }

  private getMetricSources(mapping: ServiceMetricRollupMapping): MetricRollupSource[] {
    return [mapping.initiated, mapping.succeeded, mapping.failure_events, mapping.duration]
      .filter(Boolean)
      .map((source) => (this.isEventCountSource(source) ? this.getEventCountMetricSource(source) : source));
  }

  private async readCount(
    day: Date,
    tenant: string,
    source?: MetricRollupSource | EventCountRollupSource
  ): Promise<number | null> {
    if (!source) {
      return null;
    }

    if (this.isEventCountSource(source) && source.payloadCountPath) {
      return this.readPayloadCount(day, tenant, source);
    }

    const metricSource = this.isEventCountSource(source) ? this.getEventCountMetricSource(source) : source;
    const row = await this.applyMetricSourceFilter(this.getDayMetricsQuery(day, tenant), [metricSource])
      .sum({ sum: 'value' })
      .first<AggregateRow>();

    return this.toNumber(row?.sum, 0);
  }

  private async readPayloadCount(day: Date, tenant: string, source: EventCountRollupSource): Promise<number> {
    const jsonPath = `{${source.payloadCountPath.join(',')}}`;
    const row = await this.getDayValuesQuery(day, tenant)
      .whereRaw('context @> ?::jsonb', [JSON.stringify({ namespace: source.namespace, name: source.name })])
      .select(
        this.knex.raw('COALESCE(SUM(COALESCE((value #>> ?)::numeric, 0)), 0) as sum', [jsonPath])
      )
      .first<AggregateRow>();

    return this.toNumber(row?.sum, 0);
  }

  private async readDuration(
    day: Date,
    tenant: string,
    source?: MetricRollupSource
  ): Promise<{ sum: number; count: number; max: number } | null> {
    if (!source) {
      return null;
    }

    const row = await this.applyMetricSourceFilter(this.getDayMetricsQuery(day, tenant), [source])
      .sum({ sum: 'value' })
      .count({ count: 'value' })
      .max({ max: 'value' })
      .first<AggregateRow>();

    return {
      sum: this.toNumber(row?.sum, 0),
      count: this.toNumber(row?.count, 0),
      max: this.toNumber(row?.max, 0),
    };
  }

  private async readDistinctResources(
    day: Date,
    tenant: string,
    { resource }: ServiceMetricRollupMapping
  ): Promise<number | null> {
    if (!resource) {
      return null;
    }

    const row = await this.getDayValuesQuery(day, tenant)
      .whereRaw('context @> ?::jsonb', [JSON.stringify({ namespace: resource.namespace })])
      .where((builder) => {
        resource.names.forEach((name) => builder.orWhereRaw("context->>'name' = ?", [name]));
      })
      .whereRaw("context->>? is not null", [resource.contextKey])
      .countDistinct({ count: this.knex.raw('context->>?', [resource.contextKey]) })
      .first<AggregateRow>();

    return this.toNumber(row?.count, 0);
  }

  private getDayMetricsQuery(day: Date, tenant: string) {
    return this.knex('metrics')
      .where({
        namespace: EVENT_LOG_NAMESPACE,
        name: EVENT_LOG_NAME,
        tenant,
      })
      .where('timestamp', '>=', day)
      .where('timestamp', '<', this.addDays(day, 1));
  }

  private getDayValuesQuery(day: Date, tenant: string) {
    return this.knex('values')
      .where({
        namespace: EVENT_LOG_NAMESPACE,
        name: EVENT_LOG_NAME,
        tenant,
      })
      .where('timestamp', '>=', day)
      .where('timestamp', '<', this.addDays(day, 1));
  }

  private applyMetricSourceFilter<TRecord extends Record<string, unknown>, TResult>(
    query: Knex.QueryBuilder<TRecord, TResult>,
    sources: MetricRollupSource[]
  ): Knex.QueryBuilder<TRecord, TResult> {
    return query.where((builder) => {
      sources.forEach((source) => {
        if (source.metric) {
          builder.orWhere('metric', source.metric);
        }
        if (source.metricLike) {
          builder.orWhere('metric', 'like', source.metricLike);
        }
      });
    });
  }

  private getEventCountMetricSource({ namespace, name }: EventCountRollupSource): MetricRollupSource {
    return {
      metric: `${namespace}:${name}:count`,
    };
  }

  private isEventCountSource(source: MetricRollupSource | EventCountRollupSource): source is EventCountRollupSource {
    return 'namespace' in source && 'name' in source;
  }

  private addDays(day: Date, days: number): Date {
    const result = new Date(day);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private toStartOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private formatDay(day: Date): string {
    return day.toISOString().slice(0, 10);
  }

  private toNumber(value: string | number | null | undefined, fallback: number): number {
    if (value === null || value === undefined) {
      return fallback;
    }

    return typeof value === 'number' ? value : Number(value);
  }
}
