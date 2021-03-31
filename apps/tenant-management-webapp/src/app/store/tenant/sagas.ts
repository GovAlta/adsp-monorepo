import { put, select } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { CreateTenantSuccess, FetchTenantSuccess, UpdateTenantAdminInfo } from './actions';
import axios from 'axios';

const http = axios.create();
export function* fetchTenant(action) {
  const state: RootState = yield select();

  const token = state.session.credentials.token;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const host = state.config.tenantApi.host;
  const path = state.config.tenantApi.endpoints.tenantNameByRealm;
  const realm = action.payload;
  const url = `${host}${path}/${realm}`;

  try {
    const tenant = yield http.get(url, { headers });
    yield put(FetchTenantSuccess(tenant.data));
  } catch (e) {
    yield put(ErrorNotification({ message: `failed to fetch tenant: ${e.message}` }));
  }
}

export function* isTenantAdmin(action) {
  const email = action.payload;
  try {
    const state: RootState = yield select();
    const token = state.session.credentials.token;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    };

    const host = state.config.tenantApi.host;
    const path = state.config.tenantApi.endpoints.tenantByEmail;

    const data = {
      email: email,
    };

    const url = host + path;
    const response = yield http.post(url, data, { headers });
    const findTenant = response.data.success;
    yield put(UpdateTenantAdminInfo(findTenant));
  } catch (e) {
    yield put(ErrorNotification({ message: `failed to check tenant admin: ${e.message}` }));
  }
}

export function* createTenant(action) {
  const state: RootState = yield select();
  const host = state.config.tenantApi.host;
  const path = state.config.tenantApi.endpoints.createTenant;
  const url = `${host}${path}`;
  const token = state?.session?.credentials?.token;

  if (!token) {
    yield put(ErrorNotification({ message: `failed to get auth token - ` }));
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const tenantName = action.payload;

  try {
    yield http.post(
      url,
      {
        tenantName: tenantName,
        realm: tenantName,
      },
      { headers }
    );
    yield put(CreateTenantSuccess());
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to create new tenant: ${e.message}` }));
  }
}
