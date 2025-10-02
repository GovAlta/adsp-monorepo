import { FileCriteria, FileItem, FileMetrics, FileTypeItem, Result } from './models';

export const UPLOAD_FILE = 'tenant/file-service/upload';
export const UPLOAD_FILE_SUCCESSES = 'tenant/file-service/upload/success';
export const UPLOAD_FILE_FAILED = 'tenant/file-service/upload/fail';

export const FETCH_FILE_LIST = 'tenant/file-service/files/fetch';
export const FETCH_FILE_LIST_SUCCESSES = 'tenant/file-service/files/fetch/success';
export const FETCH_FILE_LIST_FAILED = 'tenant/file-service/files/fetch/fail';

export const FETCH_FILE = 'tenant/file-service/file/fetch';
export const FETCH_FILE_SUCCESS = 'tenant/file-service/file/fetch/success';
export const FETCH_FILE_FAILED = 'tenant/file-service/file/fetch/fail';

export const DELETE_FILE = 'tenant/file-service/file/delete';
export const DELETE_FILE_SUCCESSES = 'tenant/file-service/file/delete/success';
export const DELETE_FILE_FAILED = 'tenant/file-service/file/delete/fail';

export const DOWNLOAD_FILE = 'tenant/file-service/file/download';
export const DOWNLOAD_FILE_SUCCESSES = 'tenant/file-service/file/download/success';
export const DOWNLOAD_FILE_FAILED = 'tenant/file-service/file/download/fail';

export const FETCH_FILE_TYPE = 'tenant/file-service/fileType/fetch';
export const FETCH_FILE_TYPE_SUCCEEDED = 'file-service/space/fileType/succeeded';


export const CLEAR_NEW_FILE_LIST = 'tenant/file-service/CLEAR_NEW_FILE_LIST';

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
  | FetchFileSuccessAction
  | FetchFileFailedAction
  | DeleteFileAction
  | DeleteFileSuccessAction
  | DeleteFileFailedAction
  | DownloadFileAction
  | DownloadFileSuccessAction
  | DownloadFileFailedAction
  | FetchFileTypeSucceededAction
  | FetchFileTypeAction
  | ClearNewFileListAction;



interface ClearNewFileListAction {
  type: typeof CLEAR_NEW_FILE_LIST;
}


export const ClearNewFileList = (): ClearNewFileListAction => ({
  type: CLEAR_NEW_FILE_LIST,
});

// | SetupFileAction;
export interface UploadFileAction {
  type: typeof UPLOAD_FILE;
  payload: { data: Record<string, unknown> };
}
interface UploadFileSuccessAction {
  type: typeof UPLOAD_FILE_SUCCESSES;
  payload: { result: FileItem };
}
interface UploadFileFailAction {
  type: typeof UPLOAD_FILE_FAILED;
  payload: { result: { propertyId: string } };
}

export interface FetchFilesAction {
  type: typeof FETCH_FILE_LIST;
  after: string;
  criteria: FileCriteria;
}
export interface FetchFileAction {
  type: typeof FETCH_FILE;
  after: string;
  fileId: string;
}

interface FetchFilesSuccessAction {
  type: typeof FETCH_FILE_LIST_SUCCESSES;
  payload: {
    results: { data: FileItem[]; after?: string; next?: string };
  };
}

interface FetchFilesFailedAction {
  type: typeof FETCH_FILE_LIST_FAILED;
  payload: { data: string };
}

interface FetchFileSuccessAction {
  type: typeof FETCH_FILE_SUCCESS;
  payload: {
    results: FileItem;
  };
}

interface FetchFileFailedAction {
  type: typeof FETCH_FILE_FAILED;
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

interface FetchFileTypeSucceededAction {
  type: typeof FETCH_FILE_TYPE_SUCCEEDED;
  payload: {
    fileInfo: { tenant: FileTypeItem[]; core: FileTypeItem[] };
  };
}



interface FetchFileTypeAction {
  type: typeof FETCH_FILE_TYPE;
}



// ==============
// Action Methods
// ==============

export const UploadFileService = (data: Record<string, unknown>): UploadFileAction => ({
  type: UPLOAD_FILE,
  payload: {
    data,
  },
});
export const UploadFileSuccessService = (result: FileItem): UploadFileSuccessAction => ({
  type: UPLOAD_FILE_SUCCESSES,
  payload: {
    result,
  },
});
export const UploadFileFailureService = (result: Result): UploadFileFailAction => ({
  type: UPLOAD_FILE_FAILED,
  payload: {
    result: { propertyId: result.propertyId },
  },
});

export const FetchFilesService = (after?: string, criteria?: FileCriteria): FetchFilesAction => ({
  type: FETCH_FILE_LIST,
  after,
  criteria,
});

export const FetchFilesSuccessService = (results: {
  data: FileItem[];
  after: string;
  next: string;
}): FetchFilesSuccessAction => ({
  type: FETCH_FILE_LIST_SUCCESSES,
  payload: {
    results,
  },
});
export const FetchFileService = (fileId?: string, after?: string): FetchFileAction => ({
  type: FETCH_FILE,
  after,
  fileId,
});

export const FetchFileSuccessService = (results: FileItem): FetchFileSuccessAction => ({
  type: FETCH_FILE_SUCCESS,
  payload: {
    results,
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



export const DownloadFileService = (data: string): DownloadFileAction => ({
  type: DOWNLOAD_FILE,
  payload: {
    data,
  },
});



export const FetchFileTypeSucceededService = (fileInfo: {
  tenant: FileTypeItem[];
  core: FileTypeItem[];
}): FetchFileTypeSucceededAction => ({
  type: FETCH_FILE_TYPE_SUCCEEDED,
  payload: {
    fileInfo,
  },
});


export const FetchFileTypeService = (): FetchFileTypeAction => ({
  type: FETCH_FILE_TYPE,
});

