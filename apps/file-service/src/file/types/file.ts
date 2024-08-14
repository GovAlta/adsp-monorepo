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
  mimeType?: string;
  createdBy: UserInfo;
  created: Date;
  lastAccessed?: Date;
  securityClassification?: string;
}

export interface FileRecord extends File {
  tenantId: AdspId;
  deleted: boolean;
  scanned: boolean;
  infected: boolean;
  digest?: string;
}

export interface FileCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  infected?: boolean;
  typeEquals?: string;
  recordIdEquals?: string;
  recordIdContains?: string;
  lastAccessedBefore?: string;
  lastAccessedAfter?: string;
}

export type NewFile = Pick<File, 'recordId' | 'filename' | 'mimeType'>;
