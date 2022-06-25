import { TenantEntity } from '../models';
import { TenantCriteria } from '../types';

export interface TenantRepository {
  save(type: TenantEntity): Promise<TenantEntity>;
  delete(id: string): Promise<boolean>;
  get(id: string): Promise<TenantEntity>;
  find(criteria?: TenantCriteria): Promise<TenantEntity[]>;
}
