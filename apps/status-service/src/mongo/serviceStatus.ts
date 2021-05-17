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
  async get(id: string): Promise<ServiceStatusApplicationEntity> {
    const doc = await this.model.findById(id);
    return Promise.resolve(this.fromDoc(doc));
  }

  async findQueuedDisabledApplications(queuedApplicationIds: string[]): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find({ enabled: false, _id: { $in: queuedApplicationIds } });
    const entities = docs.map((doc) => this.fromDoc(doc));
    return Promise.resolve(entities);
  }

  async findQueuedDeletedApplicationIds(queuedApplicationIds: string[]): Promise<string[]> {
    const existingApps = await this.model.find({ _id: { $in: queuedApplicationIds } });
    const existingAppIds = existingApps.map((app) => app.id);

    return queuedApplicationIds.filter((appId) => !existingAppIds.includes(appId.toString()));
  }
  async findNonQueuedApplications(queuedApplicationIds: string[]): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find({ enabled: true, _id: { $nin: queuedApplicationIds } });
    const entities = docs.map((doc) => this.fromDoc(doc));
    return Promise.resolve(entities);
  }

  async find(filter: Partial<ServiceStatusApplication>): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find(filter);
    const applications = docs.map((doc) => this.fromDoc(doc));
    return Promise.resolve(applications);
  }

  async enable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    const doc = await this.model.findByIdAndUpdate(entity.id, { enabled: true }, { new: true });
    return this.fromDoc(doc);
  }

  async disable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    const application = await this.model.findById(entity.id);
    application.endpoints.forEach((endpoint) => (endpoint.status = 'pending'));
    application.enabled = false;
    await application.save();
    return this.fromDoc(application);
  }

  async save(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    if (entity.id) {
      const doc = await this.model.findOneAndUpdate({ _id: entity.id }, this.toDoc(entity), {
        upsert: true,
        new: true,
        lean: true,
        useFindAndModify: false,
      });

      return Promise.resolve(this.fromDoc(doc));
    }

    const doc = await this.model.create(this.toDoc(entity));
    return Promise.resolve(this.fromDoc(doc));
  }

  async delete(entity: ServiceStatusApplicationEntity): Promise<boolean> {
    try {
      await this.model.findOneAndDelete({ _id: entity.id });
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  private toDoc(application: ServiceStatusApplicationEntity): Doc<ServiceStatusApplication> {
    return {
      _id: application.id,
      enabled: application.enabled,
      endpoints: application.endpoints,
      metadata: application.metadata,
      name: application.name,
      statusTimestamp: application.statusTimestamp,
      tenantId: application.tenantId,
      timeIntervalMin: application.timeIntervalMin,
    };
  }

  private fromDoc(doc: Doc<ServiceStatusApplication>): ServiceStatusApplicationEntity {
    if (!doc) {
      return null;
    }
    return new ServiceStatusApplicationEntity(this, {
      id: doc._id,
      enabled: doc.enabled,
      endpoints: doc.endpoints,
      metadata: doc.metadata,
      name: doc.name,
      statusTimestamp: doc.statusTimestamp,
      tenantId: doc.tenantId,
      timeIntervalMin: doc.timeIntervalMin,
    });
  }
}

export { MongoServiceStatusRepository };
