import { Repository, Results } from '@core-services/core-common';
import { NotificationSpaceEntity } from '../model';
import { NotificationSpace } from '../types';

export interface NotificationSpaceRepository extends Repository<NotificationSpaceEntity, NotificationSpace> {
  find(top: number, after: string): Promise<Results<NotificationSpaceEntity>>
}
