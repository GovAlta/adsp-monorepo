import { TenantEntity, Tenant } from '../models';

export interface TenantRepository {
  save(type: TenantEntity): Promise<TenantEntity>;
  delete(realm: string): Promise<void>;
  find(): Promise<TenantEntity[]>;
  // TODO: This is an inversion of abstraction anti-pattern since the filter format is from Mongo/Mongoose
  // which is a more specific implementation detail (i.e. wouldn't make sense if repo is some other persistence)
  findBy(filter: Record<string, { $regex: string; $options: 'i' } | string>): Promise<TenantEntity>;
  findByName(name: string): Promise<Tenant>;
  isTenantAdmin(email: string): Promise<boolean>;
}
