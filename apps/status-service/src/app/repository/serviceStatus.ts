import { Repository } from '@core-services/core-common';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusApplication, ServiceStatusType } from '../types';

export interface ServiceStatusRepository extends Repository<ServiceStatusApplicationEntity, ServiceStatusApplication> {
  findEnabledApplications(): Promise<ServiceStatusApplicationEntity[]>;
  findQueuedDisabledApplications(queuedApplicationIds: string[]): Promise<ServiceStatusApplicationEntity[]>;
  findNonQueuedApplications(queuedApplicationIds: string[]): Promise<ServiceStatusApplicationEntity[]>;
  findQueuedDeletedApplicationIds(queuedApplicationIds: string[]): Promise<string[]>;
  find(filter: Partial<ServiceStatusApplication>): Promise<ServiceStatusApplicationEntity[]>;
  enable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity>;
  disable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity>;
}
