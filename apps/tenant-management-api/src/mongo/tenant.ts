import { TenantRepository } from '../tenant/repository';
import { TenantEntity, Tenant } from '../tenant/models';
import { Doc, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Document, Model, model, Types } from 'mongoose';
import { tenantSchema } from './schema';
import { TenantCriteria } from '../tenant/types';

export class MongoTenantRepository implements TenantRepository {
  private tenantModel: Model<Doc<Tenant> & Document>;

  constructor() {
    this.tenantModel = model<Doc<Tenant> & Document>('tenant', tenantSchema);
  }

  async save(tenant: TenantEntity): Promise<TenantEntity> {
    const doc = await this.tenantModel.findOneAndUpdate(
      { _id: tenant.id || new Types.ObjectId() },
      this.toDoc(tenant),
      {
        upsert: true,
        new: true,
        lean: true,
      }
    );
    return Promise.resolve(this.fromDoc(doc));
  }

  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new InvalidOperationError('ID of tenant to delete not specified');
    }

    const { deletedCount } = await this.tenantModel.deleteOne({ _id: id });
    return deletedCount > 0;
  }

  async get(id: string): Promise<TenantEntity> {
    const doc = await this.tenantModel.findOne({ _id: id });

    return this.fromDoc(doc);
  }

  async find(criteria?: TenantCriteria): Promise<TenantEntity[]> {
    const query: Record<string, unknown> = {};
    if (criteria) {
      if (criteria.adminEmailEquals) {
        query.adminEmail = criteria.adminEmailEquals;
      }

      if (criteria.realmEquals) {
        query.realm = criteria.realmEquals;
      }

      if (criteria.nameEquals) {
        query.name = { $regex: `^${criteria.nameEquals}$`, $options: 'i' };
      }
    }

    const docs = (await this.tenantModel.find(query)) || [];

    return docs.map((doc) => this.fromDoc(doc));
  }

  private fromDoc(doc: Doc<Tenant>) {
    if (doc === null) {
      throw new NotFoundError('Tenant', null);
    }
    return new TenantEntity(this, {
      id: `${doc._id}`,
      name: doc.name,
      realm: doc.realm,
      adminEmail: doc.adminEmail,
    });
  }

  private toDoc(entity: TenantEntity): Doc<Tenant> {
    return {
      name: entity.name,
      realm: entity.realm,
      adminEmail: entity.adminEmail,
    };
  }
}
