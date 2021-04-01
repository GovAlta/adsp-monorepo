import { Results } from '@core-services/core-common';
import { NotificationSpaceEntity, NotificationTypeEntity } from '../model';
import { NotificationTypeCriteria } from '../types';

export interface NotificationTypeRepository {
  get(space: NotificationSpaceEntity, id: string): Promise<NotificationTypeEntity>;
  find(top: number, after: string, criteria: NotificationTypeCriteria): Promise<Results<NotificationTypeEntity>>;
  save(type: NotificationTypeEntity): Promise<NotificationTypeEntity>;
  delete(type: NotificationTypeEntity): Promise<boolean>;
}
