import { Repository } from '@core-services/core-common';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { EndpointStatusEntry } from '../types';

export interface EndpointStatusEntryRepository extends Repository<EndpointStatusEntryEntity, EndpointStatusEntry> {
  findRecentByUrlAndApplicationId(
    url: string,
    applicationId: string,
    tenantId: string,
    top,
  ): Promise<EndpointStatusEntryEntity[]>;
  findRecent(tenantId: string, ageInMinutes?: number): Promise<EndpointStatusEntryEntity[]>; // clean-code-ignore: RULE-19 type-only interface, covered by mongo/endpointStatusEntry.spec.ts
  deleteOldUrlStatus(): Promise<boolean>;
  deleteAll(appKey: string, tenantId: string): Promise<number>;
}
