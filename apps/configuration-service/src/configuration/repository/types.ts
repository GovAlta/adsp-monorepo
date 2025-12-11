import { AdspId } from '@abgov/adsp-service-sdk';

export interface ConfigurationEntityCriteria {
  namespaceEquals?: string;
  nameContains?: string;
  tenantIdEquals?: AdspId;
  registeredIdEquals?: string;
  useOr?: boolean;
  [key: string]: unknown;
}
