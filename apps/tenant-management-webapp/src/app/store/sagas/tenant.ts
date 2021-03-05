import { getTenantByRealm } from '../../api/tenant';
import { TENANT_API_INIT } from '../reducers/config.contract';
import { put } from 'redux-saga/effects';
import { TYPES } from '../actions';

export function* fetchTenant(action) {
  console.log('in saga realm ', action);
  //const realm ='core';
  const realm = action.payload ? action.payload.realm : action.realm;
  const url = `${TENANT_API_INIT.host}${TENANT_API_INIT.endpoints.tenantNameByRealm}/${realm}`;
  try {
    const tenantInfo = getTenantByRealm(url);
    const tenant = yield tenantInfo;
    console.log('in saga : tenant', tenant);
    yield put({ type: TYPES.FETCH_TENANT_INFO_SUCCESS, payload: tenant });
  } catch (e) {
    // Unexpected Http Error
    yield put({ type: TYPES.HTTP_ERROR, message: e.message });
  }
}
