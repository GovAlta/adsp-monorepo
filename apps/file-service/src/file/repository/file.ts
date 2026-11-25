import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { FileEntity } from '../model';
import { FileCriteria } from '../types';

export interface FileRepository {
  find(tenantId: AdspId, top: number, after: string, criteria: FileCriteria): Promise<Results<FileEntity>>;
  get(id: string, tenantId?: AdspId): Promise<FileEntity>; // clean-code-ignore: RULE-19 type-only interface; covered by mongo/file.spec.ts

  save(entity: FileEntity, update?: Partial<FileEntity>): Promise<FileEntity>;
  delete(entity: FileEntity): Promise<boolean>;
}
