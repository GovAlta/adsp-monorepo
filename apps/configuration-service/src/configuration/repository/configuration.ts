import { AdspId } from '@abgov/adsp-service-sdk';
import { ServiceConfigurationEntity } from '../model';
import { ConfigurationRevision } from '../types';

export interface ConfigurationRepository {
  get<C>(
    serviceId: AdspId,
    tenantId?: AdspId,
    schema?: Record<string, unknown>
  ): Promise<ServiceConfigurationEntity<C>>;

  getRevisions<C>(entity: ServiceConfigurationEntity<C>): Promise<ConfigurationRevision<C>[]>;
  saveRevision<C>(
    entity: ServiceConfigurationEntity<C>,
    revision: ConfigurationRevision<C>
  ): Promise<ConfigurationRevision<C>>;
}
