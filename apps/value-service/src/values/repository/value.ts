// clean-code-ignore: RULE-19 — interface only, no logic; implementation is covered in timescale/value.spec.ts.
import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { Metric, MetricValue, PlatformMetric, Value, ValueCriteria, MetricCriteria } from '../types';

export interface Page {
  after?: string;
  next?: string;
  size: number;
}

export interface ValuesRepository {
  writeValues(namespace: string, name: string, tenantId: AdspId, value: Omit<Value, 'tenantId'>[]): Promise<Value[]>;
  readValues(top?: number, after?: string, criteria?: ValueCriteria): Promise<Results<Value>>;

  readMetrics(
    tenantId: AdspId,
    namespace: string,
    name: string,
    top?: number,
    after?: string,
    readMetric?: MetricCriteria
  ): Promise<Record<string, Metric> & { page: Page }>;
  readMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    top?: number,
    after?: string,
    readMetric?: MetricCriteria
  ): Promise<Metric & { page: Page }>;
  // Cross-tenant read of the materialised rollups; unlike readMetrics, this never falls back to the
  // live view, since platform-scoped reporting only needs to see what has already been rolled up.
  readPlatformMetrics(namespace: string, name: string, criteria: MetricCriteria): Promise<Record<string, PlatformMetric>>;
  countValues(criteria: ValueCriteria): Promise<number>;
  writeMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    timestamp: Date,
    value: number
  ): Promise<MetricValue>;
}
