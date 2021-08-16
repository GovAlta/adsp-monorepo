import { AdspId } from '@abgov/adsp-service-sdk';

export interface ConfigurationRevision<C = Record<string, unknown>> {
  configuration: C;
  revision: number;
}

export interface Configuration<C = Record<string, unknown>> {
  namespace: string;
  name: string;
  tenantId?: AdspId;
  latest?: ConfigurationRevision<C>;
  revisions?: Record<number, ConfigurationRevision<C>>;
}
