import { Repository } from '@core-services/core-common';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusApplicationFilter, ServiceStatusApplication } from '../types';

export interface ServiceStatusRepository extends Repository<ServiceStatusApplicationEntity, ServiceStatusApplication> {
  findEnabledApplications(): Promise<ServiceStatusApplicationEntity[]>;
  find(filter: Partial<ServiceStatusApplicationFilter>): Promise<ServiceStatusApplicationEntity[]>;
  enable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity>;
  disable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity>;
}
