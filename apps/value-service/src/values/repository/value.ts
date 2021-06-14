import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { ValueDefinitionEntity } from '../model';
import { Metric, MetricValue, Value, ValueCriteria, MetricCriteria } from '../types';

export interface ValuesRepository {
  writeValue(namespace: string, name: string, tenantId: AdspId, value: Omit<Value, 'tenantId'>): Promise<Value>;
  readValues(
    top?: number,
    after?: string,
    criteria?: ValueCriteria
  ): Promise<Results<Value>>;

  readMetric(
    tenantId: AdspId,
    definition: ValueDefinitionEntity,
    metric: string,
    readMetric: MetricCriteria
  ): Promise<Metric>;
  writeMetric(
    tenantId: AdspId,
    definition: ValueDefinitionEntity,
    metric: string,
    timestamp: Date,
    value: number
  ): Promise<MetricValue>;
}
