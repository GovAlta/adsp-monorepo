import { reject } from 'q';
import { put } from 'redux-saga/effects';

import { serviceMeasure } from '../actions';
import tenantManagementApi from '../../api/tenant-management';
import { UPTIME_FETCH_SUCCEEDED, UPTIME_FETCH_FAILED } from '../actions/types';

export function* getServerStatus() {
  try {
    // TODO: hard coded for quick testing. We shall remove it to env

    // For testing
    // const healthURL = 'http://localhost:3333/api';
    // const resp = yield http.get(healthURL);
    // past resp.data to the setSererHealth
    yield put(serviceMeasure.setServerHealth({}));
  } catch (error) {
    reject(error);
  }
}

const callTenantApi = () => {
  return Promise.resolve(
    tenantManagementApi('health').then(function (data) {
      return data;
    })
  );
};

export function* uptimeFetch() {
  try {
    const uptimeResponse = yield callTenantApi();
    yield put({ type: UPTIME_FETCH_SUCCEEDED, payload: uptimeResponse.uptime });
  } catch (e) {
    yield put({ type: UPTIME_FETCH_FAILED, message: e.message });
  }
}
