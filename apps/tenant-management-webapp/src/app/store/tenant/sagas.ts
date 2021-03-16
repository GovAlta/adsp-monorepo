import { put, select } from 'redux-saga/effects';
import { RootState } from '..';
import { http } from '../../api/tenant-management';
import { ErrorNotification } from '../notifications/actions';
import { FetchTenantSuccess } from './actions';

export function* fetchTenant(action) {
  const state: RootState = yield select()

  const headers = {
    Authorization: `Bearer ${state.session.credentials.token}`,
  };

  // TODO: create an api lib (like the ) that has the host pre-configured
  // TODO: create methods within -^ for each of the endpoint urls
  const host = state.config.tenantApi.host;
  const path = state.config.tenantApi.endpoints.tenantNameByRealm;
  const realm = action.payload
  const url = `${host}${path}/${realm}`;

  try {
    const tenant = yield http.get(url, { headers });

    yield put(FetchTenantSuccess(tenant.data));
  } catch (e) {
    yield put(ErrorNotification({message: `failed to fetch tenant: ${e.message}`}));
  }
}
