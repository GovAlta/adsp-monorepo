import { takeEvery } from 'redux-saga/effects';

// Sagas
import { fetchAccess } from './access/sagas';
import { uptimeFetch } from './api-status/sagas';
import { fetchConfig } from './config/sagas';
import { fetchSpace, uploadFile, fileEnable, fetchFiles, deleteFile } from './file/sagas';
import { fetchFileTypes, deleteFileTypes, createFileType, updateFileType } from './file/sagas';
import { fetchTenant, createTenant, isTenantAdmin } from './tenant/sagas';

// Actions
import { FETCH_ACCESS_ACTION } from './access/actions';
import { API_UPTIME_FETCH_ACTION } from './api-status/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';
import { FETCH_FILE_SPACE, FILE_UPLOAD, FETCH_FILE_LIST, DELETE_FILE } from './file/actions';
import { ENABLE_FILE_SERVICE } from './file/actions';
import { FETCH_FILE_TYPE } from './file/actions';
import { DELETE_FILE_TYPE } from './file/actions';
import { CREATE_FILE_TYPE } from './file/actions';
import { UPDATE_FILE_TYPE } from './file/actions';
import { FETCH_TENANT, CREATE_TENANT, CHECK_IS_TENANT_ADMIN } from './tenant/actions';

export function* watchSagas() {
  yield takeEvery(API_UPTIME_FETCH_ACTION, uptimeFetch);
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeEvery(FETCH_ACCESS_ACTION, fetchAccess);
  yield takeEvery(FETCH_FILE_SPACE, fetchSpace);
  yield takeEvery(FILE_UPLOAD, uploadFile);
  yield takeEvery(DELETE_FILE, deleteFile);
  yield takeEvery(FETCH_FILE_LIST, fetchFiles);
  yield takeEvery(FETCH_TENANT, fetchTenant);
  yield takeEvery(ENABLE_FILE_SERVICE, fileEnable);
  yield takeEvery(FETCH_FILE_TYPE, fetchFileTypes);
  yield takeEvery(DELETE_FILE_TYPE, deleteFileTypes);
  yield takeEvery(CREATE_FILE_TYPE, createFileType);
  yield takeEvery(UPDATE_FILE_TYPE, updateFileType);
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);
}
