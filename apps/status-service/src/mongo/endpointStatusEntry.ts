import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { EndpointStatusEntry } from '../app';
import { EndpointStatusEntryEntity } from '../app/model/endpointStatusEntry';
import { EndpointStatusEntryRepository } from '../app/repository/endpointStatusEntry';
import { endpointStatusEntrySchema } from './schema';

export interface FindRecentOptions {
  limit: number;
  timeSpanMin: number;
}

const defaultFindRecentOptions: FindRecentOptions = {
  limit: 5,
  timeSpanMin: 5,
};

export default class MongoEndpointStatusEntryRepository implements EndpointStatusEntryRepository {
  model: Model<EndpointStatusEntry & Document>;
  constructor() {
    this.model = model('EndpointStatusEntry', endpointStatusEntrySchema);
  }
  async get(_id: string): Promise<EndpointStatusEntryEntity> {
    throw new Error('not implemented');
  }

  async findRecentByUrl(
    url: string,
    opts: FindRecentOptions = defaultFindRecentOptions
  ): Promise<EndpointStatusEntryEntity[]> {
    const period = opts.timeSpanMin * 60 * 1000;
    const after = Date.now() - period;
    const docs = await this.model
      .find({ url: url, timestamp: { $gt: after } })
      .sort({ timestamp: -1 })
      .limit(opts.limit);

    // ensure duplicate status entries are not returned
    const entries = docs.map((doc) => this.fromDoc(doc));
    const urlMap: { [key: number]: EndpointStatusEntryEntity } = {};
    for (const entry of entries) {
      const timeMin = entry.timestamp - (entry.timestamp % (60 * 1000));
      urlMap[timeMin] = entry;
    }

    const filteredEntries = Object.values(urlMap)
      .map((entry: EndpointStatusEntryEntity) => entry)
      .sort((entry: EndpointStatusEntryEntity) => entry.timestamp);

    return filteredEntries;
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
