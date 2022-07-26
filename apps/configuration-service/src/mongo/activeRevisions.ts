import { AdspId } from '@abgov/adsp-service-sdk';
import { model, Model } from 'mongoose';
import { ActiveRevisionRepository, ActiveRevisionEntity } from '../configuration';
import { activeRevisionSchema } from './schema';
import { ActiveRevisionDoc } from './types';
import { ActiveRevision } from '../configuration/types';

export class MongoActiveRevisionRepository implements ActiveRevisionRepository {
  private activeRevisionModel: Model<ActiveRevisionDoc>;

  constructor() {
    this.activeRevisionModel = model<ActiveRevisionDoc>('activeRevision', activeRevisionSchema);
  }

  async get(namespace: string, name: string, tenantId?: AdspId): Promise<ActiveRevisionEntity> {
    const tenant = tenantId?.toString() || { $exists: false };
    const query = { namespace, name, tenant };
    const activeDoc = await new Promise<ActiveRevisionDoc>((resolve, reject) => {
      this.activeRevisionModel
        .find(query, null, { lean: true })
        .sort({ revision: -1 })
        .limit(1)
        .exec((err, results: ActiveRevisionDoc[]) => (err ? reject(err) : resolve(results[0])));
    });

    const docs = activeDoc
      ? {
          active: activeDoc?.active,
        }
      : null;

    return new ActiveRevisionEntity(namespace, name, this, docs?.active, tenantId);
  }

  async setActiveRevision(entity: ActiveRevisionEntity, active: number): Promise<ActiveRevision> {
    const query: Record<string, unknown> = {
      namespace: entity.namespace,
      name: entity.name,
      active: entity.active,
      tenant: entity.tenantId?.toString() || { $exists: false },
    };

    const update: Record<string, unknown> = {
      namespace: entity.namespace,
      name: entity.name,
      active: active,
      tenant: entity.tenantId?.toString() || { $exists: false },
    };

    // Only include tenant if there is a tenantId on the entity.
    if (entity.tenantId) {
      update.tenant = entity.tenantId.toString();
    }

    const doc = await new Promise<ActiveRevisionDoc>((resolve, reject) => {
      this.activeRevisionModel
        .findOneAndUpdate(query, update, { upsert: true, new: true, lean: true })
        .exec((err, res) => (err ? reject(err) : resolve(res as ActiveRevisionDoc)));
    });

    const activeRevision: ActiveRevision = {
      namespace: entity.namespace,
      name: entity.name,
      tenantId: entity.tenantId,
      active: doc.active,
    };

    return activeRevision;
  }
}
