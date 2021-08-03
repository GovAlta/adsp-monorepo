import { FileItem, FileService, FileTypeItem, FileServiceDocs } from './models';

export const TERMINATE_FILE_SERVICE = 'tenant/file-service/delete'; // delete file service
export const DISABLE_FILE_SERVICE = 'tenant/file-service/activation/';
export const ENABLE_FILE_SERVICE = 'tenant/file-service/activation/activate';
export const SETUP_FILE_SERVICE = 'tenant/file-service/setup'; // The SETUP_FILE_SERVICE is only for testing

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

export const CREATE_FILE_SPACE_SUCCEEDED = 'file-service/fileSpace/create/success';
export const CREATE_FILE_SPACE_FAILED = 'file-service/fileSpace/create/failure';
export const FETCH_FILE_SPACE = 'file-service/fileSpace';
export const FETCH_FILE_SPACE_SUCCEEDED = 'file-service/fileSpace/success';
export const FETCH_FILE_SPACE_FAILED = 'file-service/fileSpace/fail';

export const FETCH_FILE_TYPE = 'tenant/file-service/fileType/fetch';
export const FETCH_FILE_TYPE_SUCCEEDED = 'file-service/space/fileType/succeeded';
export const DELETE_FILE_TYPE = 'tenant/file-service/fileType/delete';
export const DELETE_FILE_TYPE_SUCCEEDED = 'file-service/fileType/delete/success';
export const CREATE_FILE_TYPE = 'tenant/file-service/fileType/create';
export const CREATE_FILE_TYPE_SUCCEEDED = 'file-service/fileType/create/success';
export const UPDATE_FILE_TYPE = 'tenant/file-service/fileType/update';
export const UPDATE_FILE_TYPE_SUCCEEDED = 'file-service/fileType/update/success';
export const FETCH_FILE_DOCS = 'file-service/docs';
export const FETCH_FILE_DOCS_SUCCEEDED = 'file-service/docs/fetch/success';
export const FETCH_FILE_TYPE_HAS_FILE = 'file-service/docs/fetch/file/filetype';
export const FETCH_FILE_TYPE_HAS_FILE_SUCCEEDED = 'file-service/docs/fetch/file/filetype/succeeded';

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
  | SetupFileAction
  | CreateFileSpaceSucceededAction
  | CreateFileSpaceFailedAction
  | FetchFileSpaceAction
  | FetchFileSpaceSucceededAction
  | FetchFileSpaceFailedAction
  | FetchFileTypeSucceededAction
  | DeleteFileTypeSucceededAction
  | UpdateFileTypeSucceededAction
  | CreateFileTypeSucceededAction
  | FetchFileDocsSucceededAction
  | FetchFileTypeAction
  | UpdateFileTypeAction
  | DeleteFileTypeAction
  | CreateFileTypeAction
  | FetchFileTypeHasFileAction
  | FetchFileTypeHasFileSucceededAction
  | FetchFileDocsAction;
// | SetupFileAction;
export interface UploadFileAction {
  type: typeof UPLOAD_FILE;
  payload: { data: Record<string, unknown> };
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

export interface DeleteFileAction {
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

export interface DownloadFileAction {
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
interface FetchFileSpaceAction {
  type: typeof FETCH_FILE_SPACE;
}
interface FetchFileSpaceSucceededAction {
  type: typeof FETCH_FILE_SPACE_SUCCEEDED;
  payload: {
    fileInfo: { data: string };
  };
}

interface FetchFileSpaceFailedAction {
  type: typeof FETCH_FILE_SPACE_FAILED;
  payload: {
    fileInfo: { data: FileTypeItem };
  };
}

interface EnableFileServiceAction {
  type: typeof ENABLE_FILE_SERVICE;
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
  payload: FileTypeItem;
}

interface CreateFileTypeSucceededAction {
  type: typeof CREATE_FILE_TYPE_SUCCEEDED;
  payload: FileTypeItem;
}

interface FetchFileTypeAction {
  type: typeof FETCH_FILE_TYPE;
}

export interface UpdateFileTypeAction {
  type: typeof UPDATE_FILE_TYPE;
  payload: FileTypeItem;
}

export interface DeleteFileTypeAction {
  type: typeof DELETE_FILE_TYPE;
  payload: FileTypeItem;
}

export interface CreateFileTypeAction {
  type: typeof CREATE_FILE_TYPE;
  payload: FileTypeItem;
}

interface FetchFileDocsSucceededAction {
  type: typeof FETCH_FILE_DOCS_SUCCEEDED;
  payload: {
    fileDocs: FileServiceDocs;
  };
}

interface FetchFileDocsAction {
  type: typeof FETCH_FILE_DOCS;
}

export interface FetchFileTypeHasFileAction {
  type: typeof FETCH_FILE_TYPE_HAS_FILE;
  payload: string;
}

interface FetchFileTypeHasFileSucceededAction {
  type: typeof FETCH_FILE_TYPE_HAS_FILE_SUCCEEDED;
  payload: {
    hasFile: boolean;
    fileTypeId: string;
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

export const UploadFileService = (data: Record<string, unknown>): UploadFileAction => ({
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
export const FetchFileSpaceService = (): FetchFileSpaceAction => ({
  type: FETCH_FILE_SPACE,
});

export const FetchFileSpaceSucceededService = (fileInfo: { data: string }): FetchFileSpaceSucceededAction => ({
  type: FETCH_FILE_SPACE_SUCCEEDED,
  payload: {
    fileInfo,
  },
});
export const FetchFileSpaceFailedService = (fileInfo: { data: FileTypeItem }): FetchFileSpaceFailedAction => ({
  type: FETCH_FILE_SPACE_FAILED,
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

export const UpdateFileTypeSucceededService = (fileType: FileTypeItem): UpdateFileTypeSucceededAction => ({
  type: UPDATE_FILE_TYPE_SUCCEEDED,
  payload: fileType,
});

export const CreateFileTypeSucceededService = (fileType: FileTypeItem): CreateFileTypeSucceededAction => {
  return {
    type: CREATE_FILE_TYPE_SUCCEEDED,
    payload: fileType,
  };
};

export const FetchFileTypeService = (): FetchFileTypeAction => ({
  type: FETCH_FILE_TYPE,
});

export const UpdateFileTypeService = (fileType: FileTypeItem): UpdateFileTypeAction => ({
  type: UPDATE_FILE_TYPE,
  payload: fileType,
});

export const DeleteFileTypeService = (fileType: FileTypeItem): DeleteFileTypeAction => ({
  type: DELETE_FILE_TYPE,
  payload: fileType,
});

export const CreateFileTypeService = (fileType: FileTypeItem): CreateFileTypeAction => ({
  type: CREATE_FILE_TYPE,
  payload: fileType,
});

export const FetchFileDocsService = (): FetchFileDocsAction => ({
  type: FETCH_FILE_DOCS,
});

export const FetchFileDocsSucceededService = (fileDocs: FileServiceDocs): FetchFileDocsSucceededAction => ({
  type: FETCH_FILE_DOCS_SUCCEEDED,
  payload: { fileDocs: fileDocs },
});

export const FetchFileTypeHasFileService = (fileTypeId: string): FetchFileTypeHasFileAction => ({
  type: FETCH_FILE_TYPE_HAS_FILE,
  payload: fileTypeId,
});

export const FetchFileTypeHasFileSucceededService = (
  existed: boolean,
  fileTypeId: string
): FetchFileTypeHasFileSucceededAction => ({
  type: FETCH_FILE_TYPE_HAS_FILE_SUCCEEDED,
  payload: {
    hasFile: existed,
    fileTypeId: fileTypeId,
  },
});
