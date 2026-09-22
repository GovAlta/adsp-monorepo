import { DistinctContextQuery, ValueServiceClient } from '../client';
import { isEmptyPeriod } from '../period';
import { EventMetrics, ReportHandler, ReportHandlerContext } from '../types';

export type SummaryField =
  | { id: string; type: 'sum'; metric: string }
  | { id: string; type: 'avg'; metric: string }
  | { id: string; type: 'max'; metric: string }
  | { id: string; type: 'unreconciled'; requestedId: string; generatedId: string }
  | { id: string; type: 'distinct'; query: DistinctContextQuery };

/**
 * Per-service summary mapping. Add Form / Notification as handlers/<service>/summary.ts
 * and register it in the catalog — no new route.
 */
export interface ServiceSummarySource {
  /** metricLike sent to value-service event-metrics, e.g. 'pdf-service'. */
  metricLike: string;
  fields: SummaryField[];
}

function toNumber(value: string | number | undefined, fallback = 0): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function sumMetric(metrics: EventMetrics, name: string): number {
  return (metrics[name]?.values || []).reduce((total, row) => total + toNumber(row.sum), 0);
}

export function maxMetric(metrics: EventMetrics, name: string): number {
  return (metrics[name]?.values || []).reduce((highest, row) => Math.max(highest, toNumber(row.max)), 0);
}

export function avgMetric(metrics: EventMetrics, name: string): number {
  const values = metrics[name]?.values || [];
  let sum = 0;
  let count = 0;
  values.forEach((row) => {
    sum += toNumber(row.sum);
    count += toNumber(row.count);
  });
  if (count === 0) {
    return 0;
  }
  return Math.round((sum / count) * 10) / 10;
}

export function zeroSummary(source: ServiceSummarySource): Record<string, number> {
  return source.fields.reduce<Record<string, number>>((data, field) => {
    data[field.id] = 0;
    return data;
  }, {});
}

export function createSummaryHandler(client: ValueServiceClient, source: ServiceSummarySource): ReportHandler {
  return async (context: ReportHandlerContext): Promise<Record<string, number>> => {
    if (isEmptyPeriod(context.period)) {
      return zeroSummary(source);
    }

    const distinctFields = source.fields.filter((field): field is Extract<SummaryField, { type: 'distinct' }> => field.type === 'distinct');

    const [metrics, ...distinctCounts] = await Promise.all([
      client.readEventMetrics(context.token, source.metricLike, context.period.from, context.period.to),
      ...distinctFields.map((field) =>
        client.countDistinctContext(context.token, field.query, context.period.from, context.period.to)
      ),
    ]);

    const distinctById = new Map<string, number>();
    distinctFields.forEach((field, index) => {
      distinctById.set(field.id, distinctCounts[index]);
    });

    const data: Record<string, number> = {};
    source.fields.forEach((field) => {
      if (field.type === 'sum') {
        data[field.id] = sumMetric(metrics, field.metric);
      } else if (field.type === 'avg') {
        data[field.id] = avgMetric(metrics, field.metric);
      } else if (field.type === 'max') {
        data[field.id] = maxMetric(metrics, field.metric);
      } else if (field.type === 'distinct') {
        data[field.id] = distinctById.get(field.id) ?? 0;
      } else if (field.type === 'unreconciled') {
        data[field.id] = Math.max((data[field.requestedId] || 0) - (data[field.generatedId] || 0), 0);
      }
    });

    return data;
  };
}
