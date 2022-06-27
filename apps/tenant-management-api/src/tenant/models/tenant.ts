import { New } from '@core-services/core-common';
import { TenantRepository } from '../repository';
import { Tenant } from './types';

// TODO: This may be a case of anemic entity anti-pattern; there are no behaviors encapsulated in the entity.
export class TenantEntity implements Tenant {
  id: string;
  realm: string;
  adminEmail: string;
  createdBy: string;
  name: string;

  static create(repository: TenantRepository, name: string, realm: string, adminEmail: string): Promise<TenantEntity> {
    const entity = new TenantEntity(repository, { name, adminEmail, realm });
    return repository.save(entity);
  }

  constructor(private repository: TenantRepository, tenant: Tenant | New<Tenant>) {
    const record = tenant as Tenant;
    if (record.id) {
      this.id = record.id;
    }

    this.realm = tenant.realm;
    this.adminEmail = tenant.adminEmail;
    this.name = tenant.name;
  }

  save(): Promise<TenantEntity> {
    return this.repository.save(this);
  }

  delete(): Promise<boolean> {
    return this.repository.delete(this.id);
  }
}
