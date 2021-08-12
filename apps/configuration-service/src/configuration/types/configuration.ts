import { AdspId } from '@abgov/adsp-service-sdk';

export interface ConfigurationRevision<C = Record<string, unknown>> {
  configuration: C;
  revision: number;
}

export interface ServiceConfiguration<C = Record<string, unknown>> {
  serviceId: AdspId;
  tenantId?: AdspId;
  latest?: ConfigurationRevision<C>;
  revisions?: Record<number, ConfigurationRevision<C>>;
}
