import { takeEvery } from 'redux-saga/effects';

// Sagas
import { fetchAccess } from './access/sagas';
import { uptimeFetch } from './api-status/sagas';
import { fetchConfig } from './config/sagas';
import { uploadFile, enableFileService, fetchFiles, deleteFile, downloadFile, fetchSpace } from './file/sagas';
import { fetchFileTypes, deleteFileTypes, createFileType, updateFileType, fetchFileDocs } from './file/sagas';
import { fetchTenant, createTenant, isTenantAdmin } from './tenant/sagas';
import { fetchTenantConfig, createTenantConfig, updateTenantConfig } from './tenantConfig/sagas';

// Actions
import { FETCH_ACCESS_ACTION } from './access/actions';
import { API_UPTIME_FETCH_ACTION } from './api-status/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';
import {
  UPLOAD_FILE,
  FETCH_FILE_LIST,
  DELETE_FILE,
  DOWNLOAD_FILE,
  ENABLE_FILE_SERVICE,
  FETCH_FILE_TYPE,
  DELETE_FILE_TYPE,
  CREATE_FILE_TYPE,
  UPDATE_FILE_TYPE,
  FETCH_FILE_SPACE,
  FETCH_FILE_DOCS,
} from './file/actions';
import { FETCH_TENANT, CREATE_TENANT, CHECK_IS_TENANT_ADMIN } from './tenant/actions';
import { FETCH_TENANT_CONFIG, CREATE_TENANT_CONFIG, UPDATE_TENANT_CONFIG } from './tenantConfig/actions';
import { DELETE_APPLICATION_ACTION, FETCH_SERVICE_STATUS_APPS_ACTION, SAVE_APPLICATION_ACTION } from './status/actions';
import { deleteApplication, fetchServiceStatusApps, saveApplication, setApplicationStatus } from './status/sagas';
import { SET_APPLICATION_STATUS_ACTION } from './status/actions/setApplicationStatus';

export function* watchSagas() {
  yield takeEvery(API_UPTIME_FETCH_ACTION, uptimeFetch);
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeEvery(FETCH_ACCESS_ACTION, fetchAccess);

  //file service
  yield takeEvery(UPLOAD_FILE, uploadFile);
  yield takeEvery(DOWNLOAD_FILE, downloadFile);
  yield takeEvery(DELETE_FILE, deleteFile);
  yield takeEvery(FETCH_FILE_LIST, fetchFiles);
  yield takeEvery(FETCH_TENANT, fetchTenant);
  yield takeEvery(ENABLE_FILE_SERVICE, enableFileService);
  yield takeEvery(FETCH_FILE_SPACE, fetchSpace);
  yield takeEvery(FETCH_FILE_TYPE, fetchFileTypes);
  yield takeEvery(DELETE_FILE_TYPE, deleteFileTypes);
  yield takeEvery(CREATE_FILE_TYPE, createFileType);
  yield takeEvery(UPDATE_FILE_TYPE, updateFileType);
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);

  //tenant config
  yield takeEvery(FETCH_TENANT_CONFIG, fetchTenantConfig);
  yield takeEvery(CREATE_TENANT_CONFIG, createTenantConfig);
  yield takeEvery(UPDATE_TENANT_CONFIG, updateTenantConfig);
  yield takeEvery(FETCH_FILE_DOCS, fetchFileDocs);

  // service status
  yield takeEvery(FETCH_SERVICE_STATUS_APPS_ACTION, fetchServiceStatusApps);
  yield takeEvery(SAVE_APPLICATION_ACTION, saveApplication);
  yield takeEvery(DELETE_APPLICATION_ACTION, deleteApplication);
  yield takeEvery(SET_APPLICATION_STATUS_ACTION, setApplicationStatus);
}
