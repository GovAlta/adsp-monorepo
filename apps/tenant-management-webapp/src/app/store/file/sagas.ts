import { put, select, call } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import {
  CreateFileSpaceSucceededService,
  CreateFileSpaceFailedService,
  FetchFilesSuccessService,
  UploadFileSuccessService,
  FetchFileTypeSucceededService,
  UpdateFileTypeSucceededService,
  DeleteFileSuccessService,
  FetchFileDocsSucceededService,
  FetchFileTypeHasFileSucceededService,
  FetchFileTypeService,
  DeleteFileAction,
  DeleteFileTypeAction,
  CreateFileTypeAction,
  UpdateFileTypeAction,
  FetchFileTypeHasFileAction,
} from './actions';

import { FileApi } from './api';
import FormData from 'form-data';

// eslint-disable-next-line
export function* uploadFile(file) {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = yield new FileApi(state.config, token);

  const recordId = `${state.tenant.realm}-${file.payload.data.file.name}`;

  const formData = new FormData();
  formData.append('file', file.payload.data.file);
  formData.append('type', file.payload.data.type);
  formData.append('filename', file.payload.data.file.name);
  formData.append('recordId', recordId);

  try {
    const uploadFile = yield api.uploadFile(formData);
    yield put(UploadFileSuccessService(uploadFile));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* fetchFiles(): SagaIterator {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new FileApi(state.config, token);

    const files = yield call([api, api.fetchFiles]);
    yield put(FetchFilesSuccessService({ data: files.results }));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* deleteFile(file: DeleteFileAction): SagaIterator {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new FileApi(state.config, token);
    const files = yield call([api, api.deleteFile], file.payload.data);
    yield put(DeleteFileSuccessService(files));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

// eslint-disable-next-line
export function* downloadFile(file) {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = yield new FileApi(state.config, token);
    const files = yield api.downloadFiles(file.payload.data.id, token);
    const element = document.createElement('a');
    element.href = URL.createObjectURL(new Blob([files]));
    element.download = file.payload.data.filename;
    document.body.appendChild(element);
    element.click();
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* enableFileService(): SagaIterator {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new FileApi(state.config, token);
    const enableFile = yield call([api, api.enableFileService]);
    yield put(CreateFileSpaceSucceededService({ data: enableFile }));
  } catch (e) {
    yield put(CreateFileSpaceFailedService(e.message));
  }
}

export function* fetchSpace(): SagaIterator {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new FileApi(state.config, token);
    const enableFile = yield call([api, api.fetchSpace]);
    yield put(CreateFileSpaceSucceededService({ data: enableFile }));
  } catch (e) {
    yield put(CreateFileSpaceFailedService(e.message));
  }
}

export function* fetchFileTypes(): SagaIterator {
  const state = yield select();
  try {
    const token = state.session.credentials?.token;
    const api = new FileApi(state.config, token);
    const fileTypeInfo = yield call([api, api.fetchFileType]);
    yield put(FetchFileTypeSucceededService({ data: fileTypeInfo }));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - fetchFileTypes` }));
  }
}

export function* deleteFileTypes(action: DeleteFileTypeAction): SagaIterator {
  const fileType = action.payload;
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new FileApi(state.config, token);
    yield call([api, api.deleteFileType], fileType.id);
    yield put(FetchFileTypeService());
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.response.data} - deleteFileTypes` }));
  }
}

export function* createFileType(fileType: CreateFileTypeAction): SagaIterator {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = new FileApi(state.config, token);

  try {
    yield call([api, api.createFileType], fileType.payload);
    yield put(FetchFileTypeService());
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - createFileType` }));
  }
}

export function* updateFileType(action: UpdateFileTypeAction): SagaIterator {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = new FileApi(state.config, token);

  try {
    const fileType = yield call([api, api.updateFileType], action.payload);
    yield put(UpdateFileTypeSucceededService(fileType));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - updateFileType` }));
  }
}

export function* fetchFileDocs(): SagaIterator {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = new FileApi(state.config, token);
  try {
    const fileDocs = yield call([api, api.fetchFileServiceDoc]);
    yield put(FetchFileDocsSucceededService(fileDocs));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - fetchFileDoc` }));
  }
}

export function* fetchFileTypeHasFile(action: FetchFileTypeHasFileAction): SagaIterator {
  try {
    const state = yield select();
    const token = state.session.credentials.token;
    const api = new FileApi(state.config, token);
    const hasFile = yield call([api, api.fetchFileTypeHasFile], action.payload);
    yield put(FetchFileTypeHasFileSucceededService(hasFile, action.payload));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - fetchFileType.` }));
  }
}
