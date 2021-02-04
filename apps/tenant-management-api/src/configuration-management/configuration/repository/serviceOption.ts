import { Repository } from '@core-services/core-common';
import { ServiceOptionEntity } from '../model';
import { ServiceOption} from '../types';

export interface ServiceConfigurationRepository extends Repository<ServiceOptionEntity, ServiceOption> {
  getConfigOption(service: string): Promise<ServiceOptionEntity>
}