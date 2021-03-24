import { takeEvery } from 'redux-saga/effects';

// Sagas
import { fetchAccess } from './access/sagas';
import { uptimeFetch } from './api-status/sagas';
import { fetchConfig } from './config/sagas';
import { fetchSpace } from './file/sagas';
import { fetchTenant, createTenant, isTenantAdmin } from './tenant/sagas';

// Actions
import { FETCH_ACCESS_ACTION } from './access/actions';
import { API_UPTIME_FETCH_ACTION } from './api-status/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';
import { FETCH_FILE_SPACE } from './file/actions';
import { FETCH_TENANT, CREATE_TENANT, CHECK_IS_TENANT_ADMIN } from './tenant/actions';

export function* watchSagas() {
  yield takeEvery(API_UPTIME_FETCH_ACTION, uptimeFetch);
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeEvery(FETCH_ACCESS_ACTION, fetchAccess);
  yield takeEvery(FETCH_FILE_SPACE, fetchSpace);
  yield takeEvery(FETCH_TENANT, fetchTenant);
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);
}
