import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { ServiceStatusApplication, ServiceStatusApplicationEntity } from '../app';
import { ServiceStatusRepository } from '../app/repository/serviceStatus';
import { serviceStatusApplicationSchema } from './schema';

export default class MongoServiceStatusRepository implements ServiceStatusRepository {
  model: Model<ServiceStatusApplication & Document>;
  constructor() {
    this.model = model('ServiceStatus', serviceStatusApplicationSchema);
  }
  async findEnabledApplications(): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find({ internalStatus: { $ne: 'disabled' } });
    return docs.map((doc) => this.fromDoc(doc));
  }
  async get(id: string): Promise<ServiceStatusApplicationEntity> {
    const doc = await this.model.findById(id);
    return Promise.resolve(this.fromDoc(doc));
  }

  async findQueuedDisabledApplications(queuedApplicationIds: string[]): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find({
      _id: { $in: queuedApplicationIds },
      internalStatus: { $in: ['disabled'] },
    });
    return docs.map((doc) => this.fromDoc(doc));
  }

  async findQueuedDeletedApplicationIds(queuedApplicationIds: string[]): Promise<string[]> {
    const existingApps = await this.model.find({ _id: { $in: queuedApplicationIds } });
    const existingAppIds = existingApps.map((app) => app._id);

    return queuedApplicationIds.filter((appId) => {
      const exists = existingAppIds.find((id) => id.toString() === appId.toString());
      return !exists;
    });
  }
  async findNonQueuedApplications(queuedApplicationIds: string[]): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find({
      _id: { $nin: queuedApplicationIds },
      internalStatus: { $nin: ['disabled'] },
    });
    return docs.map((doc) => this.fromDoc(doc));
  }

  async find(filter: Partial<ServiceStatusApplication>): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find(filter);
    return docs.map((doc) => this.fromDoc(doc));
  }

  async enable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    const application = await this.model.findById(entity._id);
    application.endpoints.forEach((endpoint) => (endpoint.status = 'pending'));
    application.internalStatus = 'pending';
    await application.save();
    return this.fromDoc(application);
  }

  async disable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    const application = await this.model.findById(entity._id);
    application.endpoints.forEach((endpoint) => (endpoint.status = 'disabled'));
    application.internalStatus = 'disabled';
    await application.save();
    return this.fromDoc(application);
  }

  async save(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    if (entity._id) {
      const doc = await this.model.findOneAndUpdate({ _id: entity._id }, this.toDoc(entity), {
        upsert: true,
        new: true,
        lean: true,
        useFindAndModify: false,
      });

      return this.fromDoc(doc);
    }

    const doc = await this.model.create(this.toDoc(entity));
    return this.fromDoc(doc);
  }

  async delete(entity: ServiceStatusApplicationEntity): Promise<boolean> {
    try {
      await this.model.findOneAndDelete({ _id: entity._id });
      return true;
    } catch (e) {
      return false;
    }
  }

  private toDoc(application: ServiceStatusApplicationEntity): Doc<ServiceStatusApplication> {
    return {
      _id: application._id,
      endpoints: application.endpoints,
      metadata: application.metadata,
      name: application.name,
      description: application.description,
      statusTimestamp: application.statusTimestamp,
      tenantId: application.tenantId,
      internalStatus: application.internalStatus,
      publicStatus: application.publicStatus,
    };
  }

  private fromDoc(doc: Doc<ServiceStatusApplication>): ServiceStatusApplicationEntity {
    if (!doc) {
      return null;
    }
    return new ServiceStatusApplicationEntity(this, {
      _id: doc._id,
      endpoints: doc.endpoints,
      metadata: doc.metadata,
      name: doc.name,
      description: doc.description,
      statusTimestamp: doc.statusTimestamp,
      tenantId: doc.tenantId,
      internalStatus: doc.internalStatus,
      publicStatus: doc.publicStatus,
    });
  }
}

export { MongoServiceStatusRepository };
