import { FileItem, FileService, FileTypeItem } from './models';

export const TERMINATE_FILE_SERVICE = 'tenant/file-service/delete'; // delete file service
export const DISABLE_FILE_SERVICE = 'tenant/file-service/activation/';
export const ENABLE_FILE_SERVICE = 'tenant/file-service/activation/activate';
export const SET_FILE_SERVICE_ACTIVE_TAB = 'tenant/file-service/states/tabs/active';
export const SETUP_FILE_SERVICE = 'tenant/file-service/setup'; // The SETUP_FILE_SERVICE is only for testing

export const FETCH_FILE_SPACE = 'tenant/file-service/space/fetch';
export const FETCH_FILE_SPACE_SUCCESS = 'tenant/file-service/space/fetch/success';
export const UPLOAD_FILE = 'tenant/file-service/upload';
export const UPLOAD_FILE_SUCCESSES = 'tenant/file-service/upload/success';
export const UPLOAD_FILE_FAILED = 'tenant/file-service/upload/fail';
export const FETCH_FILE_LIST = 'tenant/file-service/file/fetch';
export const FETCH_FILE_LIST_SUCCESSES = 'tenant/file-service/file/fetch/success';
export const FETCH_FILE_LIST_FAILED = 'tenant/file-service/file/fetch/fail';
export const DELETE_FILE = 'tenant/file-service/file/delete';
export const DELETE_FILE_SUCCESSES = 'tenant/file-service/file/delete/success';
export const DELETE_FILE_FAILED = 'tenant/file-service/file/delete/fail';
export const DOWNLOAD_FILE = 'tenant/file-service/file/download';
export const DOWNLOAD_FILE_SUCCESSES = 'tenant/file-service/file/download/success';
export const DOWNLOAD_FILE_FAILED = 'tenant/file-service/file/download/fail';
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
  | UploadFileAction
  | UploadFileSuccessAction
  | UploadFileFailAction
  | FetchFilesAction
  | FetchFilesSuccessAction
  | FetchFilesFailedAction
  | DeleteFileAction
  | DeleteFileSuccessAction
  | DeleteFileFailedAction
  | DownloadFileAction
  | DownloadFileSuccessAction
  | DownloadFileFailedAction
  | DisableFileServiceAction
  | EnableFileServiceAction
  | TerminateFileServiceAction
  | SetActiveTabAction
  | FetchFileSpaceAction
  | FetchFileSpaceSuccessAction
  | SetupFileAction
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
// | SetupFileAction;
interface UploadFileAction {
  type: typeof UPLOAD_FILE;
  payload: { data: object };
}
interface UploadFileSuccessAction {
  type: typeof UPLOAD_FILE_SUCCESSES;
  payload: { result: { data: FileItem } };
}
interface UploadFileFailAction {
  type: typeof UPLOAD_FILE_FAILED;
  payload: { data: string };
}

interface FetchFilesAction {
  type: typeof FETCH_FILE_LIST;
}

interface FetchFilesSuccessAction {
  type: typeof FETCH_FILE_LIST_SUCCESSES;
  payload: {
    results: { data: FileItem[] };
  };
}

interface FetchFilesFailedAction {
  type: typeof FETCH_FILE_LIST_FAILED;
  payload: { data: string };
}

interface DeleteFileAction {
  type: typeof DELETE_FILE;
  payload: { data: string };
}

interface DeleteFileSuccessAction {
  type: typeof DELETE_FILE_SUCCESSES;
  payload: { data: string };
}
interface DeleteFileFailedAction {
  type: typeof DELETE_FILE_FAILED;
  payload: { data: string };
}

interface DownloadFileAction {
  type: typeof DOWNLOAD_FILE;
  payload: { data: string };
}
interface DownloadFileSuccessAction {
  type: typeof DOWNLOAD_FILE_SUCCESSES;
  payload: { data: string };
}
interface DownloadFileFailedAction {
  type: typeof DOWNLOAD_FILE_FAILED;
  payload: { data: string };
}

interface FetchFileSpaceAction {
  type: typeof FETCH_FILE_SPACE;
}
interface FetchFileSpaceSuccessAction {
  type: typeof FETCH_FILE_SPACE_SUCCESS;
  payload: {
    spaceInfo: { data: string };
  };
}

interface TerminateFileServiceAction {
  type: typeof TERMINATE_FILE_SERVICE;
  payload: {
    fileService: FileService;
  };
}

interface DisableFileServiceAction {
  type: typeof DISABLE_FILE_SERVICE;
  payload: {
    fileService: FileService;
  };
}

interface EnableFileServiceAction {
  type: typeof ENABLE_FILE_SERVICE;
}

interface SetActiveTabAction {
  type: typeof SET_FILE_SERVICE_ACTIVE_TAB;
  payload: {
    activeTab: string;
  };
}

interface SetupFileAction {
  type: typeof SETUP_FILE_SERVICE;
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

export const DisableFileService = (fileService: FileService): DisableFileServiceAction => ({
  type: DISABLE_FILE_SERVICE,
  payload: {
    fileService,
  },
});

export const EnableFileService = (): EnableFileServiceAction => ({
  type: ENABLE_FILE_SERVICE,
});

export const TerminateFileService = (fileService: FileService): TerminateFileServiceAction => ({
  type: TERMINATE_FILE_SERVICE,
  payload: {
    fileService,
  },
});

export const UploadFileService = (data: object): UploadFileAction => ({
  type: UPLOAD_FILE,
  payload: {
    data,
  },
});
export const UploadFileSuccessService = (result: { data: FileItem }): UploadFileSuccessAction => ({
  type: UPLOAD_FILE_SUCCESSES,
  payload: {
    result,
  },
});

export const FetchFilesService = (): FetchFilesAction => ({
  type: FETCH_FILE_LIST,
});

export const FetchFilesSuccessService = (results: { data: FileItem[] }): FetchFilesSuccessAction => ({
  type: FETCH_FILE_LIST_SUCCESSES,
  payload: {
    results,
  },
});

export const FetchFilesFailedService = (data: string): FetchFilesFailedAction => ({
  type: FETCH_FILE_LIST_FAILED,
  payload: {
    data,
  },
});

export const DeleteFileService = (data: string): DeleteFileAction => ({
  type: DELETE_FILE,
  payload: {
    data,
  },
});

export const DeleteFileSuccessService = (data: string): DeleteFileSuccessAction => ({
  type: DELETE_FILE_SUCCESSES,
  payload: {
    data,
  },
});

export const DeleteFileFailedService = (data: string): DeleteFileFailedAction => ({
  type: DELETE_FILE_FAILED,
  payload: {
    data,
  },
});

export const DownloadFileService = (data: string): DownloadFileAction => ({
  type: DOWNLOAD_FILE,
  payload: {
    data,
  },
});

export const DownloadFileSuccessService = (data: string): DownloadFileSuccessAction => ({
  type: DOWNLOAD_FILE_SUCCESSES,
  payload: {
    data,
  },
});

export const DownloadFileFailedService = (data: string): DownloadFileFailedAction => ({
  type: DOWNLOAD_FILE_FAILED,
  payload: {
    data,
  },
});

export const SetActiveTab = (activeTab: string): SetActiveTabAction => ({
  type: SET_FILE_SERVICE_ACTIVE_TAB,
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
  type: SETUP_FILE_SERVICE,
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
