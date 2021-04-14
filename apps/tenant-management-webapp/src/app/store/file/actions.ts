import { FileService, FileTypeItem } from './models';

export const FETCH_FILE_SPACE = 'tenant/file-service/space/fetch';
export const FETCH_FILE_SPACE_SUCCESS = 'tenant/file-service/space/fetch/success';
export const FILE_DELETE = 'tenant/file-service/delete';
export const FILE_DISABLE = 'tenant/file-service/activation/';
export const FILE_ENABLE = 'tenant/file-service/activation/activate';
export const FILE_SET_ACTIVE_TAB = 'tenant/file-service/states/tabs/active';
export const FILE_SETUP = 'tenant/file-service/setup'; // The FILE_SETUP is only for testing
export const FETCH_FILE_SPACE_FROM_FILE_API = 'tenant/file-service/space/fetch';
export const FETCH_FILE_SPACE_FROM_FILE_API_SUCCEEDED = 'file-service/space/fetch/successeded';
export const CREATE_FILE_SPACE_SUCCEEDED = 'file-service/fileSpace/createsuccess';
export const CREATE_FILE_SPACE_FAILED = 'file-service/fileSpace/createfailure';
export const FETCH_FILE_TYPE = 'tenant/file-service/fileType/fetch';
export const FETCH_FILE_TYPE_SUCCEEDED = 'file-service/space/fileType/succeeded';
export const DELETE_FILE_TYPE = 'tenant/file-service/fileType/delete';
export const DELETE_FILE_TYPE_SUCCEEDED = 'file-service/fileType/deletesuccess';
export const CREATE_FILE_TYPE = 'tenant/file-service/fileType/create';
export const CREATE_FILE_TYPE_SUCCEEDED = 'file-service/fileType/createsuccess';
export const UPDATE_FILE_TYPE = 'tenant/file-service/fileType/update';
export const UPDATE_FILE_TYPE_SUCCEEDED = 'file-service/fileType/updatesuccess';

// =============
// Actions Types
// =============

export type ActionTypes =
  | DisableFileAction
  | EnableFileAction
  | DeleteFileAction
  | SetActiveTabAction
  | FetchFileSpaceAction
  | FetchFileSpaceSuccessAction
  | SetupFileAction
  | FetchFileSpaceFromFileApiAction
  | FetchFileSpaceFromFileApiSucceededAction
  | CreateFileSpaceSucceededAction
  | CreateFileSpaceFailedAction
  | FetchFileTypeSucceededAction
  | DeleteFileTypeSucceededAction
  | UpdateFileTypeSucceededAction
  | CreateFileTypeSucceededAction
  | FetchFileTypeAction
  | UpdateFileTypeAction
  | DeleteFileTypeAction
  | CreateFileTypeAction;

interface FetchFileSpaceAction {
  type: typeof FETCH_FILE_SPACE;
}
interface FetchFileSpaceSuccessAction {
  type: typeof FETCH_FILE_SPACE_SUCCESS;
  payload: {
    spaceInfo: { data: string };
  };
}

interface DeleteFileAction {
  type: typeof FILE_DELETE;
  payload: {
    fileService: FileService;
  };
}

interface DisableFileAction {
  type: typeof FILE_DISABLE;
  payload: {
    fileService: FileService;
  };
}

interface EnableFileAction {
  type: typeof FILE_ENABLE;
}

interface SetActiveTabAction {
  type: typeof FILE_SET_ACTIVE_TAB;
  payload: {
    activeTab: string;
  };
}

interface SetupFileAction {
  type: typeof FILE_SETUP;
}

interface FetchFileSpaceFromFileApiAction {
  type: typeof FETCH_FILE_SPACE_FROM_FILE_API;
}

interface FetchFileSpaceFromFileApiSucceededAction {
  type: typeof FETCH_FILE_SPACE_FROM_FILE_API_SUCCEEDED;
  payload: {
    data: string;
  };
}

interface CreateFileSpaceSucceededAction {
  type: typeof CREATE_FILE_SPACE_SUCCEEDED;
  payload: {
    fileInfo: { data: string };
  };
}

interface CreateFileSpaceFailedAction {
  type: typeof CREATE_FILE_SPACE_FAILED;
  payload: {
    fileInfo: { data: string };
  };
}

interface FetchFileTypeSucceededAction {
  type: typeof FETCH_FILE_TYPE_SUCCEEDED;
  payload: {
    fileInfo: { data: FileTypeItem[] };
  };
}
interface DeleteFileTypeSucceededAction {
  type: typeof DELETE_FILE_TYPE_SUCCEEDED;
  payload: {
    fileInfo: { data: string };
  };
}

interface UpdateFileTypeSucceededAction {
  type: typeof UPDATE_FILE_TYPE_SUCCEEDED;
  payload: {
    fileInfo: { data: string };
  };
}

interface CreateFileTypeSucceededAction {
  type: typeof CREATE_FILE_TYPE_SUCCEEDED;
  payload: {
    fileInfo: { data: FileTypeItem };
  };
}

interface FetchFileTypeAction {
  type: typeof FETCH_FILE_TYPE;
}

interface UpdateFileTypeAction {
  type: typeof UPDATE_FILE_TYPE;
  payload: {
    fileInfo: { data: string };
  };
}

interface DeleteFileTypeAction {
  type: typeof DELETE_FILE_TYPE;
  payload: {
    fileInfo: { data: string };
  };
}

interface CreateFileTypeAction {
  type: typeof CREATE_FILE_TYPE;
  payload: {
    fileInfo: { data: string };
  };
}

// ==============
// Action Methods
// ==============

export const DisableFileService = (fileService: FileService): DisableFileAction => ({
  type: FILE_DISABLE,
  payload: {
    fileService,
  },
});

export const EnableFileService = (): EnableFileAction => ({
  type: FILE_ENABLE,
});

export const DeleteFileService = (fileService: FileService): DeleteFileAction => ({
  type: FILE_DELETE,
  payload: {
    fileService,
  },
});

export const SetActiveTab = (activeTab: string): SetActiveTabAction => ({
  type: FILE_SET_ACTIVE_TAB,
  payload: {
    activeTab,
  },
});

export const FetchFileSpace = (): FetchFileSpaceAction => ({
  type: FETCH_FILE_SPACE,
});

export const FetchFileSpaceSuccess = (spaceInfo: { data: string }): FetchFileSpaceSuccessAction => ({
  type: FETCH_FILE_SPACE_SUCCESS,
  payload: {
    spaceInfo, // FIXME: this type def (-^) needs to be fixed
  },
});

export const SetupFileService = (): SetupFileAction => ({
  type: FILE_SETUP,
});

export const FetchFileSpaceFromFileApiService = (): FetchFileSpaceFromFileApiAction => ({
  type: FETCH_FILE_SPACE_FROM_FILE_API,
});

export const CreateFileSpaceSucceededService = (fileInfo: { data: string }): CreateFileSpaceSucceededAction => ({
  type: CREATE_FILE_SPACE_SUCCEEDED,
  payload: {
    fileInfo,
  },
});
export const CreateFileSpaceFailedService = (fileInfo: { data: string }): CreateFileSpaceFailedAction => ({
  type: CREATE_FILE_SPACE_FAILED,
  payload: {
    fileInfo,
  },
});

export const FetchFileTypeSucceededService = (fileInfo: { data: FileTypeItem[] }): FetchFileTypeSucceededAction => ({
  type: FETCH_FILE_TYPE_SUCCEEDED,
  payload: {
    fileInfo,
  },
});

export const DeleteFileTypeSucceededService = (fileInfo: { data: string }): DeleteFileTypeSucceededAction => {
  return {
    type: DELETE_FILE_TYPE_SUCCEEDED,
    payload: {
      fileInfo,
    },
  };
};

export const UpdateFileTypeSucceededService = (fileInfo: { data: string }): UpdateFileTypeSucceededAction => ({
  type: UPDATE_FILE_TYPE_SUCCEEDED,
  payload: {
    fileInfo,
  },
});

export const CreateFileTypeSucceededService = (fileInfo: { data: FileTypeItem }): CreateFileTypeSucceededAction => {
  return {
    type: CREATE_FILE_TYPE_SUCCEEDED,
    payload: {
      fileInfo,
    },
  };
};

export const FetchFileTypeService = (): FetchFileTypeAction => ({
  type: FETCH_FILE_TYPE,
});

export const UpdateFileTypeService = (fileInfo: { data: string }): UpdateFileTypeAction => ({
  type: UPDATE_FILE_TYPE,
  payload: {
    fileInfo,
  },
});

export const DeleteFileTypeService = (fileInfo: { data: string }): DeleteFileTypeAction => ({
  type: DELETE_FILE_TYPE,
  payload: {
    fileInfo,
  },
});

export const CreateFileTypeService = (fileInfo: { data: string }): CreateFileTypeAction => ({
  type: CREATE_FILE_TYPE,
  payload: {
    fileInfo,
  },
});
