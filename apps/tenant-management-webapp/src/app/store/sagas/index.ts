import { uptimeFetch } from './serviceMeasure';
import { fork, all } from "redux-saga/effects";

export function* watchSagas() {
  yield all([fork(uptimeFetch)]);
}