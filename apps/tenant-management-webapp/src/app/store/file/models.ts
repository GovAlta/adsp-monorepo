import { SecurityClassification } from '@store/common/models';

export interface RetentionPolicy {
  active: boolean;
  deleteInDays: number | string;
  createdAt: string;
}

export interface FileTypeItem {
  id: string;
  name: string;
  updateRoles: string[];
  readRoles: string[];
  anonymousRead: boolean;
  hasFile?: boolean;
  securityClassification?: string;
  tableData?: {
    id: string;
  };
  rules?: {
    retention: RetentionPolicy;
  };
}

export const FileTypeDefault: FileTypeItem = {
  id: null,
  name: '',
  updateRoles: [],
  readRoles: [],
  anonymousRead: false,
  hasFile: false,
  securityClassification: SecurityClassification.ProtectedA,
};

export const FileTypeDefaultOnEdit: FileTypeItem = {
  id: null,
  name: '',
  updateRoles: [],
  readRoles: [],
  anonymousRead: false,
  hasFile: false,
  securityClassification: '',
};

export interface Result {
  error: string;
  propertyId: string;
}

export interface FileItem {
  id?: string;
  filename?: string;
  size?: number;
  fileURN?: string;
  urn: string;
  typeName?: string;
  recordId?: string;
  created?: string;
  lastAccessed?: string;
  propertyId?: string;
}

export interface RequestBodyProperties {
  type?: string;
  description?: string;
  format?: string;
}
export interface RequestBodySchema {
  schema: {
    properties: Record<string, RequestBodyProperties>;
  };
}

export interface FileCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  infected?: boolean;
  typeEquals?: string;
  recordIdEquals?: string;
  recordIdContains?: string;
}

export interface FileMetrics {
  filesUploaded?: number;
  fileLifetime?: number;
}

export interface FileService {
  fileList: Array<FileItem>;
  newFileList: Record<string, FileItem[]>;
  nextEntries: string;
  isLoading: boolean;
  fileTypes: Array<FileTypeItem>;
  coreFileTypes: Array<FileTypeItem>;
  metrics: FileMetrics;
  hasFile: Record<string, boolean>;
}

export const FILE_INIT: FileService = {
  fileList: [],
  newFileList: null,
  nextEntries: '',
  isLoading: false,
  fileTypes: null,
  coreFileTypes: null,
  metrics: {},
  hasFile: {},
};
