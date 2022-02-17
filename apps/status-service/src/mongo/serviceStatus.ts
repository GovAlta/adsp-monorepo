import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { ServiceStatusApplication, ServiceStatusApplicationFilter, ServiceStatusApplicationEntity } from '../app';
import { ServiceStatusRepository } from '../app/repository/serviceStatus';
import { serviceStatusApplicationSchema } from './schema';

export default class MongoServiceStatusRepository implements ServiceStatusRepository {
  model: Model<ServiceStatusApplication & Document>;
  constructor() {
    this.model = model<ServiceStatusApplication & Document>('ServiceStatus', serviceStatusApplicationSchema);
  }

  async findEnabledApplications(): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find({ enabled: true });
    return docs.map((doc) => this.fromDoc(doc));
  }

  async get(id: string): Promise<ServiceStatusApplicationEntity> {
    const doc = await this.model.findById(id);
    return Promise.resolve(this.fromDoc(doc));
  }

  async find(filter: Partial<ServiceStatusApplicationFilter>): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find(filter);
    return docs.map((doc) => this.fromDoc(doc));
  }

  async enable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    const application = await this.model.findById(entity._id);
    application.enabled = true;
    application.endpoint.status = 'n/a';
    await application.save();
    return this.fromDoc(application);
  }

  async disable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    const application = await this.model.findById(entity._id);
    application.endpoint.status = 'n/a';
    application.enabled = false;
    await application.save();
    return this.fromDoc(application);
  }

  async save(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity> {
    if (entity._id) {
      const doc = await this.model.findOneAndUpdate({ _id: entity._id }, this.toDoc(entity), {
        upsert: true,
        new: true,
        lean: true,
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
      endpoint: application.endpoint,
      metadata: application.metadata,
      name: application.name,
      description: application.description,
      statusTimestamp: application.statusTimestamp,
      tenantId: application.tenantId,
      tenantName: application.tenantName,
      tenantRealm: application.tenantRealm,
      status: application.status,
      enabled: application.enabled,
    };
  }

  private fromDoc(doc: Doc<ServiceStatusApplication>): ServiceStatusApplicationEntity {
    if (!doc) {
      return null;
    }
    return new ServiceStatusApplicationEntity(this, {
      _id: doc._id,
      endpoint: doc.endpoint,
      metadata: doc.metadata,
      name: doc.name,
      description: doc.description,
      statusTimestamp: doc.statusTimestamp,
      tenantId: doc.tenantId,
      tenantName: doc.tenantName,
      tenantRealm: doc.tenantRealm,
      status: doc.status,
      enabled: doc.enabled,
    });
  }
}

export { MongoServiceStatusRepository };
