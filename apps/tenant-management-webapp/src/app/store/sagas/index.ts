import { uptimeFetch } from './serviceMeasure';
import { fork, all, takeEvery } from "redux-saga/effects";
import { UPTIME_FETCH } from '../actions/types';

export function* watchSagas() {
  yield all([fork(uptimeFetch)]);
  yield takeEvery(UPTIME_FETCH, uptimeFetch);
}
