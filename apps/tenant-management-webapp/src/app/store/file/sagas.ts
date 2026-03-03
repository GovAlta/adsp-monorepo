import { SagaIterator } from '@redux-saga/core';
import { fetchServiceMetrics } from '@store/common';
import { ErrorNotification } from '@store/notifications/actions';
import { UpdateIndicator, UpdateLoadingState } from '@store/session/actions';
import { getAccessToken } from '@store/tenant/sagas';
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
  UpdateFileTypeSucceededService,
  DeleteFileSuccessService,
  CacheFileService,
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
  FetchFileMetricsSucceeded,
  FETCH_FILE_METRICS,
  FetchFilesAction,
  FetchFileAction,
  CHECK_FILE_TYPE_HAS_FILE,
  CheckFileTypeHasFileAction,
  CHECK_FILE_TYPE_HAS_FILE_SUCCESS,
} from './actions';
import { FileApi } from './api';
import { FileTypeItem } from './models';

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
    const fileId = file.payload.data.id;
    const filename = file.payload.data.filename;
    
    // Check if file is already cached
    const cachedDataUrl = state.fileService.downloadedFiles?.[fileId];
    
    let blob: Blob;
    
    if (cachedDataUrl) {
      // Use cached data URL - convert back to blob for download
      const response = yield fetch(cachedDataUrl);
      blob = yield response.blob();
    } else {
      // Download from API
      const token = yield call(getAccessToken);
      const api = yield new FileApi(state.config, token);
      const files = yield api.downloadFiles(fileId, token);
      blob = new Blob([files]);
      
      // Only cache files smaller than 1MB to avoid memory issues
      const MAX_CACHE_SIZE = 1048576; // 1MB in bytes
      if (blob.size < MAX_CACHE_SIZE) {
        // Convert blob to data URL for storage
        const dataUrl = yield new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        // Store in state for reuse (e.g., thumbnails)
        yield put(CacheFileService(fileId, dataUrl));
      }
    }
    
    // Trigger browser download
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = filename;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hasFile, ...config } = payload;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hasFile, ...config } = payload;

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

export function* fetchFileMetrics(): SagaIterator {
  yield* fetchServiceMetrics('file-service', function* (metrics) {
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
  });
}

export function* watchFileSagas(): Generator {
  //file service
  // Note: UPLOAD_FILE is now handled by a thunk in actions.ts, not a saga
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
