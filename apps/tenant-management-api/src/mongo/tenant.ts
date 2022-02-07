import { TenantRepository } from '../tenant/repository';
import { TenantEntity, Tenant } from '../tenant/models';
import { Doc, NotFoundError } from '@core-services/core-common';
import { adspId } from '@abgov/adsp-service-sdk';
import { model } from 'mongoose';
import { tenantSchema } from './schema';

export class MongoTenantRepository implements TenantRepository {
  private tenantModel;

  constructor() {
    this.tenantModel = model('tenant', tenantSchema);
  }

  async save(tenant: TenantEntity): Promise<TenantEntity> {
    const doc = await new this.tenantModel(this.toDoc(tenant)).save();
    return Promise.resolve(this.fromDoc(doc));
  }

  async delete(realm: string): Promise<void> {
    await this.tenantModel.deleteOne({ realm: realm });
  }

  async find(): Promise<TenantEntity[]> {
    const docs = await this.tenantModel.find({});

    return Promise.resolve(
      docs?.map((doc) => ({
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${doc._id}`,
        name: doc.name,
        realm: doc.realm,
        createdBy: doc.adminEmail,
      }))
    );
  }

  async isTenantAdmin(email: string): Promise<boolean> {
    const tenant = await this.tenantModel.findOne({ adminEmail: email }).populate('createdBy');
    return Promise.resolve(tenant !== null);
  }

  async findBy(filter: Record<string, string | { $regex: string; $options: 'i' }>): Promise<TenantEntity> {
    let currentFilter = filter;

    if (currentFilter.id) {
      currentFilter = { _id: currentFilter.id };
    }

    const tenant = await this.tenantModel.findOne(currentFilter).populate('createdBy');

    if (tenant == null) {
      throw new NotFoundError('Fetch tenant by filter', currentFilter.toString());
    }

    return Promise.resolve(this.fromDoc(tenant));
  }

  async findByName(name: string): Promise<Tenant> {
    const tenant = await this.tenantModel.findOne({ name: { $regex: '^' + name + '$', $options: 'i' } });
    return tenant;
  }

  private fromDoc(doc: Doc<Tenant>) {
    if (doc === null) {
      throw new NotFoundError('Tenant', null);
    }
    return new TenantEntity(this, doc._id, doc.realm, doc.adminEmail, doc.tokenIssuer, doc.name);
  }

  private toDoc(tenant: TenantEntity) {
    const id = tenant.id.toString().split('/').pop();

    return {
      ...tenant,
      id,
    };
  }
}
