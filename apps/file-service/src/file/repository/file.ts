import { Repository, Results } from '@core-services/core-common';
import { FileEntity } from '../model';
import { FileRecord, FileCriteria } from '../types';

export interface FileRepository extends Repository<FileEntity, FileRecord> {
  find(top: number, after: string, criteria: FileCriteria): Promise<Results<FileEntity>>;
  exists(criteria: FileCriteria): Promise<boolean>;
}
