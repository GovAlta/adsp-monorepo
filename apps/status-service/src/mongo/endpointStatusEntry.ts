import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { EndpointStatusEntry } from '../app';
import { EndpointStatusEntryEntity } from '../app/model/endpointStatusEntry';
import { EndpointStatusEntryRepository } from '../app/repository/endpointStatusEntry';
import { endpointStatusEntrySchema } from './schema';

export default class MongoEndpointStatusEntryRepository implements EndpointStatusEntryRepository {
  model: Model<EndpointStatusEntry & Document>;
  constructor() {
    this.model = model('EndpointStatusEntry', endpointStatusEntrySchema);
  }
  async get(_id: string): Promise<EndpointStatusEntryEntity> {
    throw new Error('not implemented');
  }

  async findRecentByUrl(url: string): Promise<EndpointStatusEntryEntity[]> {
    const period = 5 * 60 * 1000;
    const after = Date.now() - period;
    const docs = await this.model.find({ url: url, timestamp: { $gt: after } }).sort({ timestamp: -1 });
    return docs.map((doc) => this.fromDoc(doc));
  }

  async delete(_entity: EndpointStatusEntryEntity): Promise<boolean> {
    throw new Error('not implemented');
  }

  async save(entity: EndpointStatusEntryEntity): Promise<EndpointStatusEntryEntity> {
    const doc = await this.model.create(this.toDoc(entity));
    return this.fromDoc(doc);
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
