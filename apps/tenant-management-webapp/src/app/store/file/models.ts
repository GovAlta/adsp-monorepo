export interface FileTypeItem {
  name: string;
  updateRoles: string[];
  readRoles: string[];
  anonymousRead: boolean;
  tableData: {
    id: string;
  };
}

export interface FileItem {
  id: string;
  filename: string;
  size: number;
  fileURN: string;
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
  spaces: string[];
  space: string;
  fileTypes: Array<FileTypeItem>;
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
  spaces: [],
  space: '',
  fileTypes: [],
};
