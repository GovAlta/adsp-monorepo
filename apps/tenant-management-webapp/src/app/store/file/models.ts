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
}

export const FILE_INIT: FileService = {
  status: {
    isActive: true,
    isDisabled: true,
  },
  requirements: {
    setup: false,
  },
  states: {
    activeTab: 'overall-view',
  },
  spaces: [],
};
