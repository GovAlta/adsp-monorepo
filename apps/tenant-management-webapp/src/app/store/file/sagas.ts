import { put, select, call, all, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import FormData from 'form-data';
import { UpdateIndicator } from '@store/session/actions';
import {
  FetchFilesSuccessService,
  UploadFileSuccessService,
  FetchFileTypeSucceededService,
  UpdateFileTypeSucceededService,
  DeleteFileSuccessService,
  FetchFileTypeHasFileSucceededService,
  FetchFileTypeService,
  DeleteFileAction,
  DeleteFileTypeAction,
  CreateFileTypeAction,
  UpdateFileTypeAction,
  FetchFileTypeHasFileAction,
  CREATE_FILE_TYPE,
  DELETE_FILE,
  DELETE_FILE_TYPE,
  DOWNLOAD_FILE,
  FETCH_FILE_LIST,
  FETCH_FILE_TYPE,
  FETCH_FILE_TYPE_HAS_FILE,
  UPDATE_FILE_TYPE,
  UPLOAD_FILE,
  FetchFileTypeHasFileService,
} from './actions';

import { FileApi } from './api';
import { RootState } from '../index';
import axios from 'axios';
import { FileTypeItem } from './models';

// eslint-disable-next-line
export function* uploadFile(file) {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = yield new FileApi(state.config, token);

  const formData = new FormData();
  formData.append('type', file.payload.data.type);
  formData.append('filename', file.payload.data.file.name);
  formData.append('file', file.payload.data.file);

  try {
    const uploadFile = yield api.uploadFile(formData);
    yield put(UploadFileSuccessService(uploadFile));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* fetchFiles(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new FileApi(state.config, token);

    const files = yield call([api, api.fetchFiles]);
    yield put(FetchFilesSuccessService({ data: files.results }));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  }
}

export function* deleteFile(file: DeleteFileAction): SagaIterator {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new FileApi(state.config, token);
    yield call([api, api.deleteFile], file.payload.data);
    yield put(DeleteFileSuccessService(file.payload.data));
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

export function* fetchFileTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  if (configBaseUrl && token) {
    try {
      const { tenant, core } = yield all({
        tenant: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/file-service/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        core: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/file-service?core`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      });
      const fileTypeInfo = Object.entries(tenant?.data).map(([_k, type]) => type as FileTypeItem);
      const coreFileTypeInfo = Object.entries(core?.data?.latest?.configuration).map(
        ([_k, type]) => type as FileTypeItem
      );
      yield put(FetchFileTypeSucceededService({ tenant: fileTypeInfo, core: coreFileTypeInfo }));

      const fileTypes = yield select((state: RootState) => state.fileService.fileTypes);

      if (fileTypes) {
        for (const fileType of fileTypes) {
          yield put(FetchFileTypeHasFileService(fileType.id));
        }
      }

      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchFileTypes` }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* deleteFileTypes(action: DeleteFileTypeAction): SagaIterator {
  const fileType = action.payload;

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/file-service`,
        { operation: 'DELETE', property: fileType.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchFileTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.response.data} - deleteFileTypes` }));
    }
  }
}

export function* createFileType({ payload }: CreateFileTypeAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/file-service`,
        {
          operation: 'UPDATE',
          update: {
            [payload.id]: {
              id: payload.id,
              name: payload.name,
              anonymousRead: payload.anonymousRead,
              readRoles: payload.readRoles,
              updateRoles: payload.updateRoles,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(FetchFileTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - createFileType` }));
    }
  }
}

export function* updateFileType({ payload }: UpdateFileTypeAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/file-service`,
        {
          operation: 'UPDATE',
          update: {
            [payload.id]: {
              id: payload.id,
              name: payload.name,
              anonymousRead: payload.anonymousRead,
              readRoles: payload.readRoles,
              updateRoles: payload.updateRoles,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(UpdateFileTypeSucceededService(payload));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateFileType` }));
    }
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

export function* watchFileSagas(): Generator {
  //file service
  yield takeEvery(UPLOAD_FILE, uploadFile);
  yield takeEvery(DOWNLOAD_FILE, downloadFile);
  yield takeEvery(DELETE_FILE, deleteFile);
  yield takeEvery(FETCH_FILE_LIST, fetchFiles);
  yield takeEvery(FETCH_FILE_TYPE_HAS_FILE, fetchFileTypeHasFile);

  yield takeEvery(FETCH_FILE_TYPE, fetchFileTypes);
  yield takeEvery(DELETE_FILE_TYPE, deleteFileTypes);
  yield takeEvery(CREATE_FILE_TYPE, createFileType);
  yield takeEvery(UPDATE_FILE_TYPE, updateFileType);
}
