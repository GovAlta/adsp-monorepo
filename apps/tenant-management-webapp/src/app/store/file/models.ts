export interface FileTypeItem {
  id: string;
  name: string;
  updateRoles: string[];
  readRoles: string[];
  anonymousRead: boolean;
  hasFile?: boolean;
  tableData?: {
    id: string;
  };
}

export const FileTypeDefault: FileTypeItem = {
  id: null,
  name: '',
  updateRoles: [],
  readRoles: [],
  anonymousRead: false,
  hasFile: false,
};

export interface FileItem {
  id: string;
  filename: string;
  size: number;
  fileURN: string;
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

export interface FileService {
  fileList: Array<FileItem>;
  fileTypes: Array<FileTypeItem>;
}

export const FILE_INIT: FileService = {
  fileList: null,
  fileTypes: null,
};
