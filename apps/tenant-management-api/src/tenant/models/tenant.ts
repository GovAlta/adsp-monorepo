import { New } from '@core-services/core-common';
import { TenantRepository } from '../repository';
import { Tenant, TenantStatus } from './types';

// TODO: This may be a case of anemic entity anti-pattern; there are no behaviors encapsulated in the entity.
export class TenantEntity implements Tenant {
  id: string;
  realm: string;
  adminEmail: string;
  createdBy: string;
  name: string;
  status: TenantStatus;
  deletedAt?: Date | null;

  static create(
    repository: TenantRepository,
    name: string,
    realm: string,
    adminEmail: string,
    status: TenantStatus = 'active',
  ): Promise<TenantEntity> {
    const entity = new TenantEntity(repository, { name, adminEmail, realm, status });
    return repository.save(entity);
  }

  constructor(
    private repository: TenantRepository,
    tenant: Tenant | New<Tenant>,
  ) {
    const record = tenant as Tenant;
    if (record.id) {
      this.id = record.id;
    }

    this.realm = tenant.realm;
    this.adminEmail = tenant.adminEmail;
    this.name = tenant.name;
    this.status = tenant.status || 'active';
    this.deletedAt = tenant.deletedAt;
  }

  archive(): void {
    this.status = 'archived';
    this.deletedAt = new Date();
  }

  restore(): void {
    this.status = 'active';
    this.deletedAt = null;
  }

  save(): Promise<TenantEntity> {
    return this.repository.save(this);
  }

  delete(): Promise<boolean> {
    return this.repository.delete(this.id);
  }
}
