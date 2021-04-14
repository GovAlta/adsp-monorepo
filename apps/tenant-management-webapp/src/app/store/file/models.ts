export interface FileTypeItem {
  name: string;
  updateRoles: string[];
  readRoles: string[];
  anonymousRead: boolean;
  tableData: {
    id: string;
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
  spaces: [],
  space: '',
  fileTypes: [],
};
