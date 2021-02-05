import { reject } from 'q';
import { put } from 'redux-saga/effects';

import { serviceMeasure } from '../actions';
import { UPTIME_FETCH_SUCCEEDED, UPTIME_FETCH_FAILED } from '../actions/types';
import tenantManagementApi from '../../api/tenant-management';

export function* getServerStatus() {
  try {
    yield put(serviceMeasure.setServerHealth({}));
  } catch (error) {
    reject(error);
  }
}

const callTenantApi = () => {
  console.log('we get here right');
  return Promise.resolve(
    tenantManagementApi('health').then(function (data) {
      return data;
    })
  );
}

export function* uptimeFetch() {
  try {
    const uptimeResponse = yield callTenantApi();
    yield put({ type: UPTIME_FETCH_SUCCEEDED, payload: uptimeResponse.uptime });
  } catch (e) {
    yield put({ type: UPTIME_FETCH_FAILED, message: e.message });
  }
}
