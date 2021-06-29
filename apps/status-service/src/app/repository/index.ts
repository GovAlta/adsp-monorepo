import { ServiceStatusRepository } from './serviceStatus';
import { NoticeRepository } from './notice';

export interface Repositories {
  serviceStatusRepository: ServiceStatusRepository;
  noticeRepository: NoticeRepository;
  isConnected(): boolean;
}
