import { put, select } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  CheckIsTenantAdminAction,
  CreateTenantAction,
  CreateTenantSuccess,
  FetchTenantAction,
  FetchTenantSuccess,
  UpdateTenantAdminInfo,
} from './actions';
import { TenantApi } from './api';
import { TENANT_INIT } from './models';

export function* fetchTenant(action: FetchTenantAction) {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const realm = action.payload;

  try {
    const tenant = yield api.fetchTenantByRealm(realm);
    yield put(FetchTenantSuccess(tenant));
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to fetch tenant' }));
  }
}

export function* isTenantAdmin(action: CheckIsTenantAdminAction) {
  const state: RootState = yield select();
  const token = state?.session?.credentials?.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const email = action.payload;

  try {
    const response = yield api.fetchTenantByEmail(email);
    if (response.success) {
      yield put(UpdateTenantAdminInfo(response.success, response.tenant.name, response.tenant.realm));
    } else {
      yield put(UpdateTenantAdminInfo(response.success, TENANT_INIT.name, TENANT_INIT.realm));
    }
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to check tenant admin' }));
  }
}

export function* createTenant(action: CreateTenantAction) {
  const state: RootState = yield select();
  const token = state?.session?.credentials?.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const name = action.payload;

  try {
    const result = yield api.createTenant(name);
    yield put(CreateTenantSuccess(result.realm));
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to create new tenant: ${e.message}` }));
  }
}
