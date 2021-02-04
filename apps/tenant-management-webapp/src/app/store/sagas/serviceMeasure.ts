import { reject } from 'q';
import { put } from 'redux-saga/effects';

import { serviceMeasure } from '../actions';
import { UPTIME_FETCH_SUCCEEDED, UPTIME_FETCH_FAILED } from '../actions/types';
import axios from 'axios';

export function* getServerStatus() {
  try {
    yield put(serviceMeasure.setServerHealth({}));
  } catch (error) {
    reject(error);
  }
}

const getHealthStatus = async () => {
  const resp = await axios.get('/health');
  return resp.data;
};

export function* uptimeFetch() {
  try {
    const uptimeResponse = yield getHealthStatus();
    yield put({ type: UPTIME_FETCH_SUCCEEDED, payload: uptimeResponse.uptime });
  } catch (e) {
    yield put({ type: UPTIME_FETCH_FAILED, message: e.message });
  }
}
