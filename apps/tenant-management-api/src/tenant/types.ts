import { AdspId, ServiceRole } from '@abgov/adsp-service-sdk';
import { TenantStatus } from './models/types';

export const TENANT_NAME_IN_USE_MESSAGE =
  'This tenant name has already been used. Please enter a different tenant name.';

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
  deletedBefore?: Date;
  createdBefore?: Date;
}
