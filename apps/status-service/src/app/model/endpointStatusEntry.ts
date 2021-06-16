import { User } from '@abgov/adsp-service-sdk';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntry } from '../types';
import { NewOrExisting, UnauthorizedError } from '@core-services/core-common';

export class EndpointStatusEntryEntity implements EndpointStatusEntry {
  url: string;
  ok: boolean;
  timestamp: number;
  responseTime: number;
  status: number | string;

  static create(
    repository: EndpointStatusEntryRepository,
    entry: NewOrExisting<EndpointStatusEntry>
  ): Promise<EndpointStatusEntryEntity> {
    const entity = new EndpointStatusEntryEntity(repository, entry);
    return repository.save(entity);
  }

  constructor(private repository: EndpointStatusEntryRepository, entry: NewOrExisting<EndpointStatusEntry>) {
    this.ok = entry.ok;
    this.url = entry?.url;
    this.timestamp = entry.timestamp;
    this.responseTime = entry.responseTime;
    this.status = entry.status;
  }

  async delete(user: User): Promise<boolean> {
    if (!this.canDelete(user)) {
      throw new UnauthorizedError('User not authorized to delete endpoint status entries');
    }
    return await this.repository.delete(this);
  }
  canDelete(_user: User): boolean {
    // TODO: validate user's role
    return true;
  }

  canCreate(_user: User): boolean {
    // TODO: validate user's role
    return true;
  }
}
