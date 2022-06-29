import { AdspId, Tenant, TenantService } from '@abgov/adsp-service-sdk';
import { TenantRepository } from '../../repository';
import { getTenant, getTenants } from './get';

export class TenantServiceImpl implements TenantService {
  constructor(private tenantRepository: TenantRepository) {}

  getTenant(tenantId: AdspId): Promise<Tenant> {
    return getTenant(this.tenantRepository, tenantId);
  }

  getTenants(): Promise<Tenant[]> {
    return getTenants(this.tenantRepository);
  }

  async getTenantByName(name: string): Promise<Tenant> {
    const tenants = await getTenants(this.tenantRepository, { nameEquals: name });
    return tenants[0];
  }

  async getTenantByRealm(realm: string): Promise<Tenant> {
    const tenants = await getTenants(this.tenantRepository, { realmEquals: realm });
    return tenants[0];
  }
}
