import { Repository, Results } from '@core-services/core-common';
import { ServiceOptionEntity } from '../model';
import { ServiceOption} from '../types';

export interface ServiceConfigurationRepository extends Repository<ServiceOptionEntity, ServiceOption> {
  find(top: number, after: string): Promise<Results<ServiceOptionEntity>>
  findServiceOptions(service: string, top: number, after: string): Promise<Results<ServiceOptionEntity>>
  getConfigOptionByVersion(service: string, version: string): Promise<ServiceOptionEntity>
}