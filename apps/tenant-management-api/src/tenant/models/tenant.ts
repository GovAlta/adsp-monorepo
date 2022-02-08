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

  obj(): Tenant {
    return {
      id: this.id,
      realm: this.realm,
      adminEmail: this.adminEmail,
      name: this.name,
    };
  }
}
