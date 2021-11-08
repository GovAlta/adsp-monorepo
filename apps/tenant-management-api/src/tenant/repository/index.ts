import { TenantRepository } from './tenant';

export * from './tenant';

export interface Repositories {
  isConnected: () => boolean;
  tenantRepository: TenantRepository;
}
