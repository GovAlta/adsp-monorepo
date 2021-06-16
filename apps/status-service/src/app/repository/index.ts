import { EndpointStatusEntryRepository } from './endpointStatusEntry';
import { ServiceStatusRepository } from './serviceStatus';

export interface Repositories {
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  isConnected(): boolean;
}
