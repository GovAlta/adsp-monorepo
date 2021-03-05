import { put, select } from 'redux-saga/effects';
import { RootState } from '..';
import { http } from '../../api/tenant-management';
import { ErrorNotification } from '../notifications/actions';
import { FetchTenantSuccess } from './actions';
import { getToken } from '../../services/session'

export function* fetchTenant(action) {
  const state: RootState = yield select()

  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };

  const path = state.config.tenantApi.endpoints.tenantNameByRealm;
  const realm = action.payload ? action.payload.realm : action.realm;
  const url = `/${path}/${realm}`;

  try {
    const tenant = yield http.get(url, { headers });

    console.log('=== tenant', tenant)
    yield put(FetchTenantSuccess(tenant.data));
  } catch (e) {
    yield put(ErrorNotification({message: e.message}));
  }
}
