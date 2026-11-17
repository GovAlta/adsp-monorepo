import { Repository } from '@core-services/core-common';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusApplicationFilter, ServiceStatusApplication } from '../types';

export interface ServiceStatusRepository extends Repository<ServiceStatusApplicationEntity, ServiceStatusApplication> {
  getByAppKey(appKey: string, tenantId: string): Promise<ServiceStatusApplicationEntity>; // clean-code-ignore: RULE-19 type-only interface, covered by mongo/serviceStatus.spec.ts
  findEnabledApplications(tenantId: string): Promise<ServiceStatusApplicationEntity[]>;
  find(filter: Partial<ServiceStatusApplicationFilter>): Promise<ServiceStatusApplicationEntity[]>;
  enable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity>;
  disable(entity: ServiceStatusApplicationEntity): Promise<ServiceStatusApplicationEntity>;
}
