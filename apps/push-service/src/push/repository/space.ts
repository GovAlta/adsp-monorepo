import { Repository, Results } from '@core-services/core-common';
import { PushSpaceEntity } from '../model';
import { PushSpace } from '../types';

export interface PushSpaceRepository extends Repository<PushSpaceEntity, PushSpace> {
  find(top: number, after: string): Promise<Results<PushSpaceEntity>>
}
