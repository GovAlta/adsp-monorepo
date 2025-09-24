import { SagaIterator } from '@redux-saga/core';
import { fetchServiceMetrics } from '../common';
import { ErrorNotification } from '../notifications/actions';
import { UpdateIndicator, UpdateLoadingState } from '../session/actions';
import { getAccessToken } from '../tenant/sagas';
import axios from 'axios';
import moment from 'moment';
import FormData from 'form-data';
import { put, select, call, all, takeEvery } from 'redux-saga/effects';
import { RootState } from '../index';
import {
  FetchFilesSuccessService,
  FetchFileSuccessService,
  UploadFileSuccessService,
  FetchFileTypeSucceededService,
  DeleteFileSuccessService,
  FetchFileTypeService,
  DeleteFileAction,
  DELETE_FILE,
  DOWNLOAD_FILE,
  FETCH_FILE_LIST,
  FETCH_FILE_TYPE,
  FETCH_FILE,
  UPLOAD_FILE,
  FetchFilesAction,
  FetchFileAction,
  UploadFileFailureService,
} from './actions';
import { FileApi } from './api';
import { FileTypeItem } from './models';



// eslint-disable-next-line
export function* uploadFile(file) {
  const state = yield select();
  const token = yield call(getAccessToken);
  const api = yield new FileApi(state.config, token);

  const formData = new FormData();
  formData.append('type', file.payload.data.type);
  formData.append('filename', file.payload.data.file.name);
  formData.append('file', file.payload.data.file);

  try {
    yield put(
      UpdateLoadingState({
        name: UPLOAD_FILE,
        state: 'start',
      })
    );

    const uploadFile = yield api.uploadFile(formData);

    uploadFile.propertyId = file.payload.data.propertyId;
    yield put(UploadFileSuccessService(uploadFile));

    yield put(
      UpdateLoadingState({
        name: UPLOAD_FILE,
        state: 'completed',
      })
    );
  } catch (err) {
    yield put(
      UpdateLoadingState({
        name: UPLOAD_FILE,
        state: 'error',
      })
    );

    yield put(UploadFileFailureService({ error: err.message, propertyId: file.payload.data.propertyId }));

    yield put(ErrorNotification({ error: err }));
  }
}

export function* fetchFiles(action: FetchFilesAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const state = yield select();
  try {
    const token = yield call(getAccessToken);
    const api = new FileApi(state.config, token, action.after);

    const files = yield call([api, api.fetchFiles], action.criteria);
    yield put(FetchFilesSuccessService({ data: files.results, after: files.page.after, next: files.page.next }));

    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  }
}

export function* fetchFile(action: FetchFileAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading File...',
    })
  );

  const state = yield select();
  try {
    const token = yield call(getAccessToken);
    const api = new FileApi(state.config, token, action.after);

    const file = yield call([api, api.fetchFile], action.fileId);

    yield put(FetchFileSuccessService(file));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
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
    const token = yield call(getAccessToken);
    const api = new FileApi(state.config, token);
    yield call([api, api.deleteFile], file.payload.data);
    yield put(DeleteFileSuccessService(file.payload.data));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

// eslint-disable-next-line
export function* downloadFile(file) {
  const state = yield select();
  try {
    const token = yield call(getAccessToken);
    const api = yield new FileApi(state.config, token);
    const files = yield api.downloadFiles(file.payload.data.id, token);
    const element = document.createElement('a');
    element.href = URL.createObjectURL(new Blob([files]));
    element.download = file.payload.data.filename;
    document.body.appendChild(element);
    element.click();
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* fetchFileTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

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
      const fileTypeInfo = Object.entries(tenant?.data || {})
        .map(([_k, type]) => type as FileTypeItem)
        .sort((fileType1, fileType2) => {
          return fileType1.name.localeCompare(fileType2.name);
        });
      const coreFileTypeInfo = Object.entries(core?.data?.latest?.configuration || {})
        .map(([_k, type]) => type as FileTypeItem)
        .sort((fileType1, fileType2) => {
          return fileType1.name.localeCompare(fileType2.name);
        });
      yield put(FetchFileTypeSucceededService({ tenant: fileTypeInfo, core: coreFileTypeInfo }));

      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}




export function* watchFileSagas(): Generator {
  //file service
  yield takeEvery(UPLOAD_FILE, uploadFile);
  yield takeEvery(DOWNLOAD_FILE, downloadFile);
  yield takeEvery(DELETE_FILE, deleteFile);
  yield takeEvery(FETCH_FILE_LIST, fetchFiles);
  yield takeEvery(FETCH_FILE, fetchFile);
  yield takeEvery(FETCH_FILE_TYPE, fetchFileTypes);

}
