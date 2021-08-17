import { Repository, Results } from '@core-services/core-common';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeApplication } from '../types';

export interface NoticeRepository extends Repository<NoticeApplicationEntity, NoticeApplication> {
  find(top: number, after: string, filter: Partial<NoticeApplication>): Promise<Results<NoticeApplicationEntity>>;
}
