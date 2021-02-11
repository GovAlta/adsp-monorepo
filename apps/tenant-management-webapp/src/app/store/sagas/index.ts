import { uptimeFetch } from './serviceMeasure';
import * as fileSagas from './file'
import { fork, all, takeEvery } from "redux-saga/effects";
import { TYPES } from '../actions';

export function* watchSagas() {
  yield all([fork(uptimeFetch)]);
  yield takeEvery(TYPES.UPTIME_FETCH, uptimeFetch);
  yield takeEvery(TYPES.FETCH_FILE_SPACE, fileSagas.fetchSpace);
}
