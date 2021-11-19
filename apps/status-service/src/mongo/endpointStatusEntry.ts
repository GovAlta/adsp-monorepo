import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { EndpointStatusEntry, EndpointStatusEntryRepositoryOptions } from '../app';
import { EndpointStatusEntryEntity } from '../app/model/endpointStatusEntry';
import { EndpointStatusEntryRepository } from '../app/repository/endpointStatusEntry';
import { endpointStatusEntrySchema } from './schema';

export const defaultStatusEntryOptions: EndpointStatusEntryRepositoryOptions = {
  limit: 200,
  everyMilliseconds: 60 * 1000,
};

export default class MongoEndpointStatusEntryRepository implements EndpointStatusEntryRepository {
  model: Model<EndpointStatusEntry & Document>;
  constructor(private opts: EndpointStatusEntryRepositoryOptions = defaultStatusEntryOptions) {
    this.model = model<EndpointStatusEntry & Document>('EndpointStatusEntry', endpointStatusEntrySchema);
  }
  async get(_id: string): Promise<EndpointStatusEntryEntity> {
    throw new Error('not implemented');
  }

  async findRecentByUrl(url: string, top = this.opts.limit): Promise<EndpointStatusEntryEntity[]> {
    const docs = await this.model
      .find({ url: url })
      .sort({ timestamp: -1 })
      .limit(top);

    const entries = docs.map((doc) => this.fromDoc(doc));

    return entries;
  }

  async delete(_entity: EndpointStatusEntryEntity): Promise<boolean> {
    throw new Error('not implemented');
  }

  async save(entity: EndpointStatusEntryEntity): Promise<EndpointStatusEntryEntity> {
    const doc = await this.model.create(this.toDoc(entity));
    return this.fromDoc(doc);
  }

  async deleteOldUrlStatus(): Promise<boolean> {
    try {
      await this.model.deleteMany({ timestamp: {$lt: Date.now() - 1000 * 3600 * 2}})
      return true
    } catch (e) {
      return false
    }
  }

  private toDoc(endpoint: EndpointStatusEntryEntity): Doc<EndpointStatusEntry> {
    return {
      ok: endpoint.ok,
      responseTime: endpoint.responseTime,
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
      status: doc.status,
      timestamp: doc.timestamp,
      url: doc.url,
    });
  }
}
