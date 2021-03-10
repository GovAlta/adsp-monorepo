import { executeGetWithAccessToken } from '../../api/http';
import { CONFIG_INIT } from '../reducers/config.contract';
import { put } from 'redux-saga/effects';
import { TYPES } from '../actions';

export function* fetchTenant(action) {
  const realm = action.payload ? action.payload.realm : action.realm;
  const url = `${CONFIG_INIT.tenantAPI.host}${CONFIG_INIT.tenantAPI.endpoints.tenantNameByRealm}/${realm}`;
  try {
    const tenantInfo = executeGetWithAccessToken(url);
    const tenant = yield tenantInfo;
    yield put({ type: TYPES.FETCH_TENANT_INFO_SUCCESS, payload: tenant });
  } catch (e) {
    // Unexpected Http Error
    yield put({ type: TYPES.HTTP_ERROR, message: e.message });
  }
}
