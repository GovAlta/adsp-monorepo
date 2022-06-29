import { Repository } from '@core-services/core-common';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { EndpointStatusEntry } from '../types';

export interface EndpointStatusEntryRepository extends Repository<EndpointStatusEntryEntity, EndpointStatusEntry> {
  findRecentByUrlAndApplicationId(url: string, applicationId: string, top): Promise<EndpointStatusEntryEntity[]>;
  deleteOldUrlStatus(): Promise<boolean>;
}
