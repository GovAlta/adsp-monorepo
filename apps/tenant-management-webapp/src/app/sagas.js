import { put, takeEvery } from 'redux-saga/effects'
import tenantManagementApi from './api/tenant-management';
import { UPTIME_FETCH, UPTIME_FETCH_SUCCEEDED, UPTIME_FETCH_FAILED } from '../actions/types';

const callTenantApi = () => {
  return Promise.resolve(tenantManagementApi('health').then(function(data) {
    return data;
  }));
}
function* uptimeFetch(action) {
   try {
      const uptimeResponse = yield callTenantApi();
      yield put({type: UPTIME_FETCH_SUCCEEDED, payload: uptimeResponse.uptime});
   } catch (e) {
      yield put({type: UPTIME_FETCH_FAILED, message: e.message});
   }
}

function* mySaga() {
  yield takeEvery(UPTIME_FETCH, uptimeFetch);
}

export default mySaga;
