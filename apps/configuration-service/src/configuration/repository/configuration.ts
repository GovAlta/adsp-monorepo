import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { ConfigurationEntity } from '../model';
import { ConfigurationDefinition, ConfigurationRevision } from '../types';
import { ConfigurationEntityCriteria } from './types';

export interface ConfigurationRepository {
  find<C>(criteria: ConfigurationEntityCriteria, top: number, after: string): Promise<Results<ConfigurationEntity<C>>>;

  get<C>(
    namespace: string,
    name: string,
    tenantId?: AdspId,
    definition?: ConfigurationDefinition
  ): Promise<ConfigurationEntity<C>>;

  delete<C>(entity: ConfigurationEntity<C>): Promise<boolean>;

  getRevisions<C>(
    entity: ConfigurationEntity<C>,
    top: number,
    after: string,
    criteria: unknown
  ): Promise<Results<ConfigurationRevision<C>>>;

  saveRevision<C>(
    entity: ConfigurationEntity<C>,
    revision: ConfigurationRevision<C>
  ): Promise<ConfigurationRevision<C>>;
}
