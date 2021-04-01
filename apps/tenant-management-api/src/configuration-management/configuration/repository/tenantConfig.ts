import { Repository, Results } from '@core-services/core-common';
import { TenantConfigEntity } from '../model';
import { TenantConfig } from '../types';

export interface TenantConfigurationRepository extends Repository<TenantConfigEntity, TenantConfig> {
  find(top: number, after: string): Promise<Results<TenantConfigEntity>>;
  getTenantConfig(name: string): Promise<TenantConfigEntity>;
}
