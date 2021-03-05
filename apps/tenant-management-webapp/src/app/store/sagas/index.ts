import { uptimeFetch } from './serviceMeasure';
import * as fileSagas from './file';
import { fetchTenant } from './tenant';
import { fork, all, takeEvery } from 'redux-saga/effects';
import { TYPES } from '../actions';
import { FETCH_ACCESSINFO_ACTION } from '../access/types';
import { fetchAccessInfo } from '../access/saga'

export function* watchSagas() {
  yield all([fork(uptimeFetch)]);
  yield takeEvery(TYPES.UPTIME_FETCH, uptimeFetch);
  yield takeEvery(TYPES.FETCH_FILE_SPACE, fileSagas.fetchSpace);
  yield takeEvery(TYPES.FETCH_TENANT_INFO_SUCCESS, fetchTenant);
  yield takeEvery(FETCH_ACCESSINFO_ACTION, fetchAccessInfo);
}
