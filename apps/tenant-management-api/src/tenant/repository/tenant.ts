import { TenantEntity, Tenant } from '../models';

export interface TenantRepository {
  save(type: TenantEntity): Promise<TenantEntity>;
  delete(realm: string): Promise<void>;
  find(): Promise<TenantEntity[]>;
  issuers(): Promise<string[]>;
  findBy(filter: Record<string, { $regex: string; $options: 'i' } | string>): Promise<TenantEntity>;
  findByName(name: string): Promise<Tenant>;
  isTenantAdmin(email: string): Promise<boolean>;
  fetchRealmToNameMapping(): Promise<Record<string, string>>;
  validateIssuer(issuer: string): Promise<boolean>;
}
