import { TenantEntity } from '../models';
export interface TenantRepository {
  save(type: TenantEntity): Promise<TenantEntity>;
  delete(real: string);
  find(): Promise<TenantEntity[]>;
  issuers(): Promise<string[]>;
  findBy(filter: Record<string, string>): Promise<TenantEntity>;
  isTenantAdmin(email: string): Promise<boolean>;
  fetchRealmToNameMapping(): Promise<Record<string, string>>;
  validateIssuer(issuer: string): Promise<boolean>;
}
