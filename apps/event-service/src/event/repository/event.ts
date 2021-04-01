import { Results } from '@core-services/core-common';
import { NamespaceEntity, EventDefinitionEntity } from '../model';

export interface EventRepository {
  getNamespace(name: string): Promise<NamespaceEntity>;
  getNamespaces(top: number, after: string): Promise<Results<NamespaceEntity>>;
  getDefinition(namespace: string, name: string): Promise<EventDefinitionEntity>;
  save(entity: NamespaceEntity): Promise<NamespaceEntity>;
}
