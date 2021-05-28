import { Repository, Results } from '@core-services/core-common';
import { DirectoryEntity } from '../model';
import { Directory } from '../types';

export interface DirectoryRepository extends Repository<DirectoryEntity, Directory> {
  find(top: number, after: string): Promise<Results<DirectoryEntity>>;
}
