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
  retentionDays?: number;
  securityClassification?: string;
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
  typeEquals?: string;
  recordIdEquals?: string;
  lastAccessedBefore?: string;
  lastAccessedAfter?: string;
}

export type NewFile = {
  recordId: string;
  filename: string;
};

export type SecurityClassificationMimeTypeInfo = {
  securityClassification: string;
  mimeType?: string;
};
