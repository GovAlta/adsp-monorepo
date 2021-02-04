import { Repository } from '@core-services/core-common';
import { TenantConfigEntity } from '../model';
import { TenantConfig} from '../types';

export interface TenantConfigurationRepository extends Repository<TenantConfigEntity, TenantConfig> {
  getTenantConfig(name: string): Promise<TenantConfigEntity>
}