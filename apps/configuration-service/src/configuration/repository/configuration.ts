import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { ConfigurationEntity } from '../model';
import { ConfigurationRevision } from '../types';

export interface ConfigurationRepository {
  get<C>(
    namespace: string,
    name: string,
    tenantId?: AdspId,
    schema?: Record<string, unknown>
  ): Promise<ConfigurationEntity<C>>;

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
  setActiveRevision<C>(
    entity: ConfigurationEntity<C>,
    revision: ConfigurationRevision,
    latestRevision: ConfigurationRevision
  ): Promise<ConfigurationRevision<C>>;
}
