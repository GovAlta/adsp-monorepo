import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { Logger } from 'winston';
import { ServiceStatusApplication, ServiceStatusApplicationFilter, ServiceStatusApplicationEntity } from '../app';
import { ServiceStatusRepository } from '../app/repository/serviceStatus';
import { serviceStatusApplicationSchema } from './schema';

export default class MongoServiceStatusRepository implements ServiceStatusRepository {
  model: Model<ServiceStatusApplication & Document>;
  constructor(private logger: Logger) {
    this.model = model<ServiceStatusApplication & Document>('ServiceStatus', serviceStatusApplicationSchema);
    this.model.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }

  async findEnabledApplications(tenantId: string): Promise<ServiceStatusApplicationEntity[]> {
    const docs = await this.model.find({ enabled: true, tenantId: tenantId });
    return docs.map((doc) => this.fromDoc(doc));
  }

  async get(appKey: string): Promise<ServiceStatusApplicationEntity> {
    const docs = await this.model.find({ appKey: appKey });
    const doc = docs.length > 0 ? docs[0] : null;
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
      appKey: application.appKey,
      endpoint: application.endpoint,
      metadata: application.metadata,
      statusTimestamp: application.statusTimestamp,
      status: application.status,
      enabled: application.enabled,
      tenantId: application.tenantId,
    };
  }

  private fromDoc(doc: Doc<ServiceStatusApplication>): ServiceStatusApplicationEntity {
    if (!doc) {
      return null;
    }
    return new ServiceStatusApplicationEntity(this, {
      _id: doc._id,
      appKey: doc.appKey,
      endpoint: doc.endpoint,
      metadata: doc.metadata,
      statusTimestamp: doc.statusTimestamp,
      status: doc.status,
      enabled: doc.enabled,
      tenantId: doc.tenantId,
    });
  }
}

export { MongoServiceStatusRepository };
