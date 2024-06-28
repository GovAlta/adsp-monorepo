import { AdspId } from '@abgov/adsp-service-sdk';

export interface ConfigurationEntityCriteria {
  namespaceEquals?: string;
  tenantIdEquals?: AdspId;
}
