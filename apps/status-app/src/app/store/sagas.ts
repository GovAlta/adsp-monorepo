import { takeEvery } from 'redux-saga/effects';

import { fetchConfig } from './config/sagas';
import { FETCH_CONFIG_ACTION } from './config/actions';

export function* watchSagas() {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
}
