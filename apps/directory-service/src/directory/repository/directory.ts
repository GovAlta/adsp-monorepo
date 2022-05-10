import { Results } from '@core-services/core-common';
import { DirectoryEntity } from '../model';
import { Directory, Criteria } from '../types';

export interface DirectoryRepository {
  find(top: number, after: string, criteria: Criteria): Promise<Results<DirectoryEntity>>;
  getDirectories(name: string): Promise<DirectoryEntity>;
  exists(name: string): Promise<boolean>;
  update(directory: Directory): Promise<boolean>;
  save(type: DirectoryEntity): Promise<DirectoryEntity>;
}
