import { ForkEffect, takeEvery } from 'redux-saga/effects';

import { fetchConfig } from './config/sagas';
import { FETCH_CONFIG_ACTION } from './config/actions';
import { FETCH_APPLICATIONS_ACTION, FETCH_CROSS_TENANTS_NOTICES_ACTION } from './status/actions';
import { fetchApplications, fetchCrossTenantsNotices } from './status/saga';

export function* watchSagas(): Generator<ForkEffect<never>, void, unknown> {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeEvery(FETCH_APPLICATIONS_ACTION, fetchApplications);
  yield takeEvery(FETCH_CROSS_TENANTS_NOTICES_ACTION, fetchCrossTenantsNotices);

}
