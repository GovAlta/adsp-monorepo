import { AdspId } from '@abgov/adsp-service-sdk';
import { ConfigurationEntity } from '../model';
import { ConfigurationRevision } from '../types';

export interface ConfigurationRepository {
  get<C>(
    namespace: string,
    name: string,
    tenantId?: AdspId,
    schema?: Record<string, unknown>
  ): Promise<ConfigurationEntity<C>>;

  getRevisions<C>(entity: ConfigurationEntity<C>): Promise<ConfigurationRevision<C>[]>;
  saveRevision<C>(
    entity: ConfigurationEntity<C>,
    revision: ConfigurationRevision<C>
  ): Promise<ConfigurationRevision<C>>;
}
