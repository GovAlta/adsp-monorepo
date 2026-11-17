import { AdspId, ServiceRole } from '@abgov/adsp-service-sdk';
import { TenantStatus } from './models/types';

export interface ServiceClient {
  serviceId: AdspId;
  roles: ServiceRole[];
}

export interface TenantCriteria {
  idEquals?: string;
  nameEquals?: string;
  realmEquals?: string;
  adminEmailEquals?: string;
  activeOnly?: boolean;
  excludeArchived?: boolean;
  statusEquals?: TenantStatus;
}
