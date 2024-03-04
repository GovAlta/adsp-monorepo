import { put, select, call, all, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import FormData from 'form-data';
import { UpdateIndicator, UpdateLoadingState } from '@store/session/actions';
import {
  FetchFilesSuccessService,
  FetchFileSuccessService,
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
  FETCH_FILE,
  FETCH_FILE_TYPE_HAS_FILE,
  UPDATE_FILE_TYPE,
  UPLOAD_FILE,
  FetchFileMetricsSucceeded,
  FETCH_FILE_METRICS,
  FetchFilesAction,
  FetchFileAction,
  CHECK_FILE_TYPE_HAS_FILE,
  CheckFileTypeHasFileAction,
  CHECK_FILE_TYPE_HAS_FILE_SUCCESS,
} from './actions';

import { FileApi } from './api';
import { RootState } from '../index';
import axios from 'axios';
import { FileTypeItem } from './models';
import moment from 'moment';
import { getAccessToken } from '@store/tenant/sagas';

export function* checkFileTypeHasFileSaga(action: CheckFileTypeHasFileAction): SagaIterator {
  try {
    const state = yield select();
    const token = yield call(getAccessToken);
    const api = new FileApi(state.config, token);
    const hasFile = yield call([api, api.fetchFileTypeHasFile], action.payload);

    yield put({
      type: CHECK_FILE_TYPE_HAS_FILE_SUCCESS,
      payload: {
        hasFile,
        fileTypeId: action.payload,
      },
    });
  } catch (err) {
    // Handle error
    yield put(ErrorNotification({ error: err }));
  }
}

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
      const fileTypeInfo = Object.entries(tenant?.data)
        .map(([_k, type]) => type as FileTypeItem)
        .sort((fileType1, fileType2) => {
          return fileType1.name.localeCompare(fileType2.name);
        });
      const coreFileTypeInfo = Object.entries(core?.data?.latest?.configuration)
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

export function* deleteFileTypes(action: DeleteFileTypeAction): SagaIterator {
  const fileType = action.payload;

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

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
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* createFileType({ payload }: CreateFileTypeAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const { ...config } = payload;

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/file-service`,
        {
          operation: 'UPDATE',
          update: {
            [payload.id]: config,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(FetchFileTypeService());
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* updateFileType({ payload }: UpdateFileTypeAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    const { ...config } = payload;

    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/file-service`,
        {
          operation: 'UPDATE',
          update: {
            [payload.id]: config,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(UpdateFileTypeSucceededService(payload));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* fetchFileTypeHasFile(action: FetchFileTypeHasFileAction): SagaIterator {
  try {
    const state = yield select();
    const token = yield call(getAccessToken);
    const api = new FileApi(state.config, token);
    const hasFile = yield call([api, api.fetchFileTypeHasFile], action.payload);
    yield put(FetchFileTypeHasFileSucceededService(hasFile, action.payload));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

interface MetricResponse {
  values: { sum: string; avg: string }[];
}

export function* fetchFileMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
        metricLike: 'file-service',
      });

      const { data: metrics }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const uploadedMetric = 'file-service:file-uploaded:count';
      const lifetimeMetric = 'file-service:file-lifetime:duration';
      yield put(
        FetchFileMetricsSucceeded({
          filesUploaded: parseInt(metrics[uploadedMetric]?.values[0]?.sum || '0', 10),
          fileLifetime: metrics[lifetimeMetric]?.values[0]
            ? moment.duration(parseInt(metrics[lifetimeMetric]?.values[0].avg, 10), 'seconds').asDays()
            : null,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
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
  yield takeEvery(FETCH_FILE_TYPE_HAS_FILE, fetchFileTypeHasFile);
  yield takeEvery(CHECK_FILE_TYPE_HAS_FILE, checkFileTypeHasFileSaga);

  yield takeEvery(FETCH_FILE_TYPE, fetchFileTypes);
  yield takeEvery(DELETE_FILE_TYPE, deleteFileTypes);
  yield takeEvery(CREATE_FILE_TYPE, createFileType);
  yield takeEvery(UPDATE_FILE_TYPE, updateFileType);
  yield takeEvery(FETCH_FILE_METRICS, fetchFileMetrics);
}
