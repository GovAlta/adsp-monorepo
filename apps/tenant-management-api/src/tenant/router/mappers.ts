import { TenantEntity } from '../models';

interface TenantResponse {
  id: string;
  realm: string;
  name: string;
  adminEmail: string;
}

export function mapTenant(tenant: TenantEntity): TenantResponse {
  return {
    id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`,
    realm: tenant.realm,
    name: tenant.name,
    adminEmail: tenant.adminEmail,
  };
}
