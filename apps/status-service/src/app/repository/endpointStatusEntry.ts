import { Repository } from '@core-services/core-common';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { EndpointStatusEntry } from '../types';

export interface EndpointStatusEntryRepository extends Repository<EndpointStatusEntryEntity, EndpointStatusEntry> {
  findRecentByUrl(url: string): Promise<EndpointStatusEntryEntity[]>;
}
