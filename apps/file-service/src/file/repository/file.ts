import { Repository, Results } from '@core-services/core-common';
import { FileEntity } from '../model';
import { File, FileCriteria } from '../types';

export interface FileRepository extends Repository<FileEntity, File> {
  find(top: number, after: string, criteria: FileCriteria): Promise<Results<FileEntity>>;
}
