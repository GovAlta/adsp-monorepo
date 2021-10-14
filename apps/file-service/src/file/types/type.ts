import { AdspId } from '@abgov/adsp-service-sdk';

export interface FileType {
  tenantId: AdspId;
  id: string;
  name: string;
  anonymousRead: boolean;
  readRoles: string[];
  updateRoles: string[];
}

export interface FileTypeCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  spaceEquals?: string;
  typeEquals?: string;
}
