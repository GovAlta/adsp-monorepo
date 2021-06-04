import { AdspId } from '@abgov/adsp-service-sdk';
import { ValueDefinitionEntity } from '../model';
import { Metric, MetricValue, Value, ValueCriteria, MetricCriteria } from '../types';

export interface ValuesRepository {
  writeValue(tenantId: AdspId, definition: ValueDefinitionEntity, value: Value): Promise<Value>;
  readValues(tenantId: AdspId, namespace: string, name: string, criteria: ValueCriteria): Promise<Value[]>;

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
