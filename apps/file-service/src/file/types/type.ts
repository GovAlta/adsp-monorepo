import type { AdspId, FileType as BaseFileType } from '@abgov/adsp-service-sdk';

export interface FileType extends BaseFileType {
  tenantId: AdspId;
}

export interface FileTypeCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  spaceEquals?: string;
  typeEquals?: string;
}
