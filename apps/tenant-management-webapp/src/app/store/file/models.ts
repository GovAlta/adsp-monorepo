//import { SecurityClassifications } from '@abgov/adsp-service-sdk';

export enum SecurityClassifications {
  Protected_A = 'Protected A',
  Protected_B = 'Protected B',
  Protected_C = 'Protected C',
  Public = 'Public',
}

//Converts the Secure Classifications Enum to a array.
export const SecurityClassificationsMap: {
  value: string;
  text: string;
}[] = Object.entries(SecurityClassifications).map(([value, text]) => ({ value, text }));

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
  securityClassification: SecurityClassificationsMap.find((y) => y.text === SecurityClassifications.Protected_A).value,
};

export interface FileItem {
  id: string;
  filename: string;
  size: number;
  fileURN: string;
  urn: string;
  typeName?: string;
  recordId?: string;
  created?: string;
  lastAccessed?: string;
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
}

export interface FileMetrics {
  filesUploaded?: number;
  fileLifetime?: number;
}

export interface FileService {
  fileList: Array<FileItem>;
  nextEntries: string;
  isLoading: boolean;
  fileTypes: Array<FileTypeItem>;
  coreFileTypes: Array<FileTypeItem>;
  metrics: FileMetrics;
}

export const FILE_INIT: FileService = {
  fileList: [],
  nextEntries: '',
  isLoading: false,
  fileTypes: null,
  coreFileTypes: null,
  metrics: {},
};
