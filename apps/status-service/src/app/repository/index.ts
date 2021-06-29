import { EndpointStatusEntryRepository } from './endpointStatusEntry';
import { ServiceStatusRepository } from './serviceStatus';
import { NoticeRepository } from './notice';

export interface Repositories {
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  noticeRepository: NoticeRepository;
  isConnected(): boolean;
}
