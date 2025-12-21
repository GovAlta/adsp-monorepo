import { AdspId } from '@abgov/adsp-service-sdk';

export interface ConfigurationRevision<C = Record<string, unknown>> {
  configuration: C;
  revision: number;
  created?: Date;
  lastUpdated?: Date;
}

export interface Configuration<C = Record<string, unknown>> {
  namespace: string;
  name: string;
  description?: string;
  tenantId?: AdspId;
  latest?: ConfigurationRevision<C>;
}

export interface RevisionCriteria {
  revision?: number;
  [key: string]: unknown;
}
