import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { Logger } from 'winston';
import { EndpointStatusEntry, EndpointStatusEntryRepositoryOptions } from '../app';
import { EndpointStatusEntryEntity } from '../app/model/endpointStatusEntry';
import { EndpointStatusEntryRepository } from '../app/repository/endpointStatusEntry';
import { endpointStatusEntrySchema } from './schema';

export const defaultStatusEntryOptions: EndpointStatusEntryRepositoryOptions = {
  limit: 200,
  everyMilliseconds: 60 * 1000,
  ageInMinutes: 31,
};

export default class MongoEndpointStatusEntryRepository implements EndpointStatusEntryRepository {
  model: Model<EndpointStatusEntry & Document>;
  constructor(private logger: Logger, private opts: EndpointStatusEntryRepositoryOptions = defaultStatusEntryOptions) {
    this.model = model<EndpointStatusEntry & Document>('EndpointStatusEntry', endpointStatusEntrySchema);
    this.model.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }
  async get(_id: string): Promise<EndpointStatusEntryEntity> {
    throw new Error('not implemented');
  }

  async findRecentByUrlAndApplicationId(
    url: string,
    applicationId: string,
    top = this.opts.limit
  ): Promise<EndpointStatusEntryEntity[]> {
    const docs = await this.model.find({ url: url, applicationId: applicationId }).sort({ timestamp: -1 }).limit(top);

    const entries = docs.map((doc) => this.fromDoc(doc));

    return entries;
  }

  async findRecent(minutes = this.opts.ageInMinutes): Promise<EndpointStatusEntryEntity[]> {
    const since = new Date(Date.now() - minutes * 60_000); // X minutes ago
    const docs = await this.model.find({ timestamp: { $gte: since } }); // only docs newer than `since`.sort({ timestamp: -1 });

    const entries = docs.map((doc) => this.fromDoc(doc));

    return entries;
  }

  async delete(_entity: EndpointStatusEntryEntity): Promise<boolean> {
    throw new Error('not implemented');
  }

  async deleteAll(appKey: string): Promise<number> {
    const count = await this.model.deleteMany({ applicationId: appKey });
    return count.deletedCount;
  }

  async save(entity: EndpointStatusEntryEntity): Promise<EndpointStatusEntryEntity> {
    const doc = await this.model.create(this.toDoc(entity));
    return this.fromDoc(doc);
  }

  async deleteOldUrlStatus(): Promise<boolean> {
    try {
      await this.model.deleteMany({ timestamp: { $lt: Date.now() - 1000 * 3600 * 48 } });
      return true;
    } catch (e) {
      return false;
    }
  }

  private toDoc(endpoint: EndpointStatusEntryEntity): Doc<EndpointStatusEntry> {
    return {
      ok: endpoint.ok,
      responseTime: endpoint.responseTime,
      applicationId: endpoint.applicationId,
      status: endpoint.status,
      timestamp: endpoint.timestamp,
      url: endpoint.url,
    };
  }

  private fromDoc(doc: Doc<EndpointStatusEntry>): EndpointStatusEntryEntity {
    if (!doc) {
      return null;
    }
    return new EndpointStatusEntryEntity(this, {
      ok: doc.ok,
      responseTime: doc.responseTime,
      applicationId: doc.applicationId,
      status: doc.status,
      timestamp: doc.timestamp,
      url: doc.url,
    });
  }
}
