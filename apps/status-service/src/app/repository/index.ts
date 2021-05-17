import { ServiceStatusRepository } from './serviceStatus';

export interface Repositories {
  serviceStatusRepository: ServiceStatusRepository;
  isConnected(): boolean;
}
