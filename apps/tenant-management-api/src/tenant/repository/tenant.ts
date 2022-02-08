import { TenantEntity } from '../models';
import { TenantCriteria } from '../types';

export interface TenantRepository {
  save(type: TenantEntity): Promise<TenantEntity>;
  delete(realm: string): Promise<void>;
  get(id: string): Promise<TenantEntity>;
  find(criteria?: TenantCriteria): Promise<TenantEntity[]>;
}
