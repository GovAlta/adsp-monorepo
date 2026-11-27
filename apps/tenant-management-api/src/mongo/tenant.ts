import { Doc, InvalidOperationError, InvalidValueError, NotFoundError } from '@core-services/core-common';
import { Document, isValidObjectId, Model, model, Types } from 'mongoose';
import { Logger } from 'winston';
import { TenantEntity, Tenant } from '../tenant/models';
import { TenantRepository } from '../tenant/repository';
import { TENANT_NAME_IN_USE_MESSAGE, TenantCriteria } from '../tenant/types';
import { tenantSchema } from './schema';
import { escapeRegExp } from 'lodash';

// Criteria values go into the query as-is, so an object such as { $ne: null } would act as an operator.
function asQueryString(value: unknown, criterion: string): string {
  if (typeof value !== 'string') {
    throw new InvalidOperationError(`Tenant criterion ${criterion} must be a string.`);
  }
  return value;
}

export class MongoTenantRepository implements TenantRepository {
  private tenantModel: Model<Doc<Tenant> & Document>;

  constructor(private logger: Logger) {
    this.tenantModel = model<Doc<Tenant> & Document>('tenant', tenantSchema);
    this.tenantModel.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }

  async save(tenant: TenantEntity): Promise<TenantEntity> {
    try {
      const doc = await this.tenantModel.findOneAndUpdate(
        { _id: tenant.id || new Types.ObjectId() },
        this.toDoc(tenant),
        {
          upsert: true,
          new: true,
          lean: true,
        },
      );
      return this.fromDoc(doc);
    } catch (err) {
      // Two saves can both pass validateName; the unique name index rejects the second.
      if (err?.code === 11000 && err?.keyPattern?.name) {
        throw new InvalidValueError('Tenant name', TENANT_NAME_IN_USE_MESSAGE);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new InvalidOperationError('ID of tenant to delete not specified');
    }

    if (!isValidObjectId(id)) {
      return false;
    }

    const { deletedCount } = await this.tenantModel.deleteOne({ _id: id });
    return deletedCount > 0;
  }

  async get(id: string): Promise<TenantEntity> {
    // An id that is not an ObjectId cannot match a tenant, and querying with it throws a CastError.
    if (!isValidObjectId(id)) {
      throw new NotFoundError('Tenant', id);
    }

    const doc = await this.tenantModel.findOne({ _id: id });
    if (!doc) {
      throw new NotFoundError('Tenant', id);
    }
    return this.fromDoc(doc);
  }

  async find(criteria?: TenantCriteria): Promise<TenantEntity[]> {
    const query: Record<string, unknown> = {};
    if (criteria) {
      if (criteria.idEquals) {
        if (!isValidObjectId(criteria.idEquals)) {
          return [];
        }
        query._id = criteria.idEquals;
      }

      if (criteria.adminEmailEquals) {
        query.adminEmail = asQueryString(criteria.adminEmailEquals, 'adminEmailEquals');
      }

      if (criteria.realmEquals) {
        query.realm = asQueryString(criteria.realmEquals, 'realmEquals');
      }

      if (criteria.nameEquals) {
        // The name is matched as a whole, ignoring case, and is not a pattern.
        query.name = { $regex: `^${escapeRegExp(asQueryString(criteria.nameEquals, 'nameEquals'))}$`, $options: 'i' };
      }

      if (criteria.statusEquals === 'active') {
        // Tenants created before status existed have no stored value; fromDoc treats them as active.
        query.status = { $in: ['active', null] };
      } else if (criteria.statusEquals) {
        query.status = criteria.statusEquals;
      } else if (criteria.activeOnly) {
        query.status = { $nin: ['provisioning', 'archived'] };
      } else if (criteria.excludeArchived) {
        query.status = { $ne: 'archived' };
      }

      if (criteria.createdBefore) {
        query.createdAt = { $lt: criteria.createdBefore };
      }

      if (criteria.deletedBefore) {
        query.deletedAt = { $lt: criteria.deletedBefore };
      }
    }

    const docs = (await this.tenantModel.find(query)) || [];

    return docs.map((doc) => this.fromDoc(doc));
  }

  private fromDoc(doc: Doc<Tenant>) {
    return new TenantEntity(this, {
      id: `${doc._id}`,
      name: doc.name,
      realm: doc.realm,
      adminEmail: doc.adminEmail,
      status: doc.status || 'active',
      deletedAt: doc.deletedAt,
    });
  }

  private toDoc(entity: TenantEntity): Doc<Tenant> {
    return {
      name: entity.name,
      realm: entity.realm,
      adminEmail: entity.adminEmail,
      status: entity.status,
      deletedAt: entity.deletedAt,
    };
  }
}
