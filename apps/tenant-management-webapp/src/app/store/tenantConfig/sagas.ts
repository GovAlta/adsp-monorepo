import { put, select, call } from 'redux-saga/effects';
import { BasicNotification, ErrorNotification } from '@store/notifications/actions';
import {
  FetchTenantConfigSuccessService,
  CreateTenantConfigSuccessService,
  UpdateTenantConfigSuccessService,
} from './actions';
import { TenantConfigApi } from './api';
import { TENANT_CONFIG_DEFAULT } from './models';
import { SagaIterator } from '@redux-saga/core';

export function* fetchTenantConfig(): SagaIterator {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = new TenantConfigApi(state.config.tenantApi, token);
    const tenantConfig = yield call([api, api.fetchTenantConfig]);

    yield put(FetchTenantConfigSuccessService(tenantConfig.configurationSettingsList));
  } catch (e) {
    yield put(BasicNotification({ message: e.message }));
  }
}

export function* createTenantConfig() {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = yield new TenantConfigApi(state.config.tenantApi, token);
    const data = {
      configurationSettingsList: TENANT_CONFIG_DEFAULT,
    };
    const tenantConfig = yield api.createTenantConfig(data);
    yield put(CreateTenantConfigSuccessService(tenantConfig.configurationSettingsList));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* updateTenantConfig(config) {
  const state = yield select();
  try {
    const token = state.session?.credentials?.token;
    const api = yield new TenantConfigApi(state.config.tenantApi, token);
    const data = {
      configurationSettingsList: config.payload.data,
    };
    const tenantConfig = yield api.updateTenantConfig(data);
    yield put(UpdateTenantConfigSuccessService(tenantConfig.configurationSettingsList));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
