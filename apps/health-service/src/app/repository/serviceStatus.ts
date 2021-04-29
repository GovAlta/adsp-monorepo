import { Repository, Results } from '@core-services/core-common';
import {} from '../model';
import { ServiceStatusEntity } from '../model/serviceStatus';
import { ServiceStatus } from '../types';

export interface ServiceStatusRepository extends Repository<ServiceStatusEntity, ServiceStatus> {
  getByTenantId(tenantId: string): Promise<ServiceStatusEntity>;
}
