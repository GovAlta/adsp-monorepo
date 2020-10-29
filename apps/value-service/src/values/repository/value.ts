import { Results, User } from '@core-services/core-common';
import { NamespaceEntity, ValueDefinitionEntity } from '../model';
import { Metric, MetricValue, Value, ValueCriteria, MetricCriteria } from '../types';

export interface ValuesRepository {
  getNamespace(user: User, name: string): Promise<NamespaceEntity>
  getNamespaces(user: User, top: number, after: string): Promise<Results<NamespaceEntity>>
  
  save(entity: NamespaceEntity): Promise<NamespaceEntity>
  saveDefinition(definitionEntity: ValueDefinitionEntity): Promise<ValueDefinitionEntity>
  
  writeValue(definition: ValueDefinitionEntity, value: Value): Promise<Value>
  readValues(definition: ValueDefinitionEntity, criteria: ValueCriteria): Promise<Value[]>

  readMetric(
    definition: ValueDefinitionEntity, 
    metric: string,
    readMetric: MetricCriteria
  ): Promise<Metric>
  writeMetric(
    definition: ValueDefinitionEntity, 
    metric: string, 
    timestamp: Date, 
    value: number
  ): Promise<MetricValue>
}
