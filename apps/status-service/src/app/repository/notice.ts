import { Repository } from '@core-services/core-common';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeApplication} from '../types';

export interface NoticeRepository extends Repository<NoticeApplicationEntity, NoticeApplication> {
  find(filter: Partial<NoticeApplication>): Promise<NoticeApplicationEntity[]>;
}