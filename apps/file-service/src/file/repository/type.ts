import { AdspId } from '@abgov/adsp-service-sdk';
import { FileTypeEntity } from '../model';

export interface FileTypeRepository {
  getType(tenantId: AdspId, id: string): Promise<FileTypeEntity>;
}
