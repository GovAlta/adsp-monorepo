import type { Tenant } from '@abgov/adsp-service-sdk';
import { Repository, Results } from '@core-services/core-common';
import { FileSpaceEntity, FileTypeEntity } from '../model';
import { FileSpace } from '../types';

export interface FileSpaceRepository extends Repository<FileSpaceEntity, FileSpace> {
  find(top: number, after: string): Promise<Results<FileSpaceEntity>>;
  getType(spaceId: string, typeId: string): Promise<FileTypeEntity>;
  getIdByTenant(tenant: Tenant): Promise<string>;
}
