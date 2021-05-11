export interface FileTypeItem {
  name: string;
  updateRoles: string[];
  readRoles: string[];
  anonymousRead: boolean;
  tableData: {
    id: string;
  };
  id: string;
}

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

export interface FileServiceApiDoc {
  path: string;
  method: string;
  description: string;
  requestBody;
  parameters?;
}

export interface SwaggerParameter {
  name: string;
  description: string;
  schema?: {
    type;
  };
}

export interface FileServiceDoc {
  apiDocs: Array<FileServiceApiDoc>;
  description: string;
}
export interface FileServiceDocs {
  fileTypeDoc: FileServiceDoc;
  fileDoc: FileServiceDoc;
}

export interface RequestBodyProperties {
  type?: string;
  description?: string;
}
export interface RequestBodySchema {
  schema: {
    properties: Record<string, RequestBodyProperties>;
  };
}

export interface FileService {
  status: {
    isActive: boolean;
    isDisabled: boolean;
  };
  requirements: {
    setup: boolean;
  };
  fileList: Array<FileItem>;
  states: {
    activeTab: string;
  };
  space: string;
  fileTypes: Array<FileTypeItem>;
  docs?: FileServiceDocs;
}

export const FILE_INIT: FileService = {
  status: {
    isActive: false,
    isDisabled: true,
  },
  requirements: {
    setup: false,
  },
  states: {
    activeTab: 'overall-view',
  },
  fileList: [],
  space: '',
  fileTypes: [],
  docs: null,
};
