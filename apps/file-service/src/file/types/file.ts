import { AdspId } from '@abgov/adsp-service-sdk';

export interface UserInfo {
  id: string;
  name: string;
}

export interface File {
  id: string;
  recordId: string;
  filename: string;
  size: number;
  createdBy: UserInfo;
  created: Date;
  lastAccessed?: Date;
}

export interface FileRecord extends File {
  tenantId: AdspId;
  deleted: boolean;
  scanned: boolean;
  infected: boolean;
}

export interface FileCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  infected?: boolean;
  tenantEquals?: string;
  typeEquals?: string;
  recordIdEquals?: string;
}

export type NewFile = {
  recordId: string;
  filename: string;
};
