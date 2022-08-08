import { AdspId } from '@abgov/adsp-service-sdk';
import { model, Model } from 'mongoose';
import { ActiveRevisionRepository } from '../configuration';
import { activeRevisionSchema } from './schema';
import { ActiveRevisionDoc } from './types';
import { ConfigurationEntity } from '../configuration';

export class MongoActiveRevisionRepository implements ActiveRevisionRepository {
  private activeRevisionModel: Model<ActiveRevisionDoc>;

  constructor() {
    this.activeRevisionModel = model<ActiveRevisionDoc>('activeRevision', activeRevisionSchema);
  }

  async get(namespace: string, name: string, tenantId?: AdspId): Promise<ActiveRevisionDoc> {
    const tenant = tenantId?.toString() || { $exists: false };
    const query = { namespace, name, tenant };
    const activeDoc = await new Promise<ActiveRevisionDoc>((resolve, reject) => {
      this.activeRevisionModel
        .find(query, null, { lean: true })
        .sort({ revision: -1 })
        .limit(1)
        .exec((err, results: ActiveRevisionDoc[]) => (err ? reject(err) : resolve(results[0])));
    });

    return activeDoc;
  }

  async setActiveRevision<C>(entity: ConfigurationEntity<C>, active: number): Promise<ConfigurationEntity<C>> {
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

    entity.active = doc.active;

    return entity;
  }
}
