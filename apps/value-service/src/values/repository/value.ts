import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { Metric, MetricValue, Value, ValueCriteria, MetricCriteria } from '../types';

export interface Page {
  after?: string;
  next?: string;
  size: number;
}

export interface ValuesRepository {
  writeValue(namespace: string, name: string, tenantId: AdspId, value: Omit<Value, 'tenantId'>): Promise<Value>;
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
  writeMetric(
    tenantId: AdspId,
    namespace: string,
    name: string,
    metric: string,
    timestamp: Date,
    value: number
  ): Promise<MetricValue>;
}
