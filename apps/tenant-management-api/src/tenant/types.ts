import { AdspId, ServiceRole } from '@abgov/adsp-service-sdk';

export interface ServiceClient {
  serviceId: AdspId;
  roles: ServiceRole[];
}

export interface TenantCriteria {
  idEquals?: string;
  nameEquals?: string;
  realmEquals?: string;
  adminEmailEquals?: string;
}
