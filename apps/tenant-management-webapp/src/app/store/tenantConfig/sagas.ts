import { put, select } from 'redux-saga/effects';
import { BasicNotification, ErrorNotification } from '@store/notifications/actions';
import {
  FetchTenantConfigSuccessService,
  CreateTenantConfigSuccessService,
  UpdateTenantConfigSuccessService,
} from './actions';
import { TenantConfigApi } from './api';
import { TENANT_CONFIG_DEFAULT } from './models';

export function* fetchTenantConfig() {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = yield new TenantConfigApi(state.config.tenantApi, token);
  try {
    const tenantConfig = yield api.fetchTenantConfig();
    yield put(FetchTenantConfigSuccessService(tenantConfig.configurationSettingsList));
  } catch (e) {
    yield put(BasicNotification({ message: e.message }));
  }
}

export function* createTenantConfig() {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = yield new TenantConfigApi(state.config.tenantApi, token);
  const data = {
    configurationSettingsList: TENANT_CONFIG_DEFAULT,
  };
  try {
    const tenantConfig = yield api.createTenantConfig(data);
    yield put(CreateTenantConfigSuccessService(tenantConfig.configurationSettingsList));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* updateTenantConfig(config) {
  const state = yield select();
  const token = state.session.credentials.token;
  const api = yield new TenantConfigApi(state.config.tenantApi, token);
  const data = {
    configurationSettingsList: config.payload.data,
  };
  try {
    const tenantConfig = yield api.updateTenantConfig(data);
    yield put(UpdateTenantConfigSuccessService(tenantConfig.configurationSettingsList));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
