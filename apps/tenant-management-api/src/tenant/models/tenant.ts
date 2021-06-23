import { TenantRepository } from '../repository';
import { Tenant } from './types';
import { AdspId, adspId } from '@abgov/adsp-service-sdk';

export class TenantEntity implements Tenant {
  id: AdspId;
  realm: string;
  adminEmail: string;
  tokenIssuer: string;
  createdBy: string;
  name: string;

  constructor(
    private repository: TenantRepository,
    id: string,
    realm: string,
    adminEmail: string,
    tokenIssuer: string,
    name: string
  ) {
    this.id = adspId`urn:ads:platform:tenant-service:v2:/tenants/${id}`;
    this.realm = realm;
    this.adminEmail = adminEmail;
    this.tokenIssuer = tokenIssuer;
    this.name = name;
  }

  save() {
    return this.repository.save(this);
  }

  obj() {
    return {
      id: this.id.resource.split('/').pop(),
      realm: this.realm,
      adminEmail: this.adminEmail,
      tokenIssuer: this.tokenIssuer,
      name: this.tokenIssuer,
    };
  }
}
