import { TenantEntity } from '../models';
import { TenantStatus } from '../models/types';

interface TenantResponse {
  id: string;
  realm: string;
  name: string;
  status: TenantStatus;
  adminEmail?: string;
}

export function mapTenant(tenant: TenantEntity, anonymous = false): TenantResponse {
  return anonymous
    ? {
        id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`,
        realm: tenant.realm,
        name: tenant.name,
        status: tenant.status,
      }
    : {
        id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`,
        realm: tenant.realm,
        name: tenant.name,
        status: tenant.status,
        adminEmail: tenant.adminEmail,
      };
}
