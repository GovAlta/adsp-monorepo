import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ApplicationApi } from './api';
import { ServiceTokenApi } from './serviceTokenApi';
import {
  fetchApplicationsSuccess,
  FetchApplicationsAction,
  fetchNoticesSuccess,
  SubscribeToTenantAction,
  subscribeToTenantSuccess,
} from './actions';
import { parseNotices, bindApplicationsWithNotices } from './models';
import { addErrorMessage, updateIsReady, updateTenantName } from '@store/session/actions';
import { SagaIterator } from '@redux-saga/core';
import { toTenantName } from './models';

export function* fetchApplications(action: FetchApplicationsAction): SagaIterator {
  const rootState: RootState = yield select();
  const name = action.payload;
  const baseUrl = rootState.config.serviceUrls.serviceStatusApiUrl;

  try {
    const api = new ApplicationApi(baseUrl);
    yield put(updateIsReady(false));
    const unKebabName = toTenantName(name);

    if (unKebabName) {
      yield put(updateTenantName(unKebabName));
    } else {
      yield put(updateTenantName('platform'));
    }

    const applications = yield call([api, api.getApplications], unKebabName);
    const noticesRaw = yield call([api, api.getNotices], unKebabName);
    const notices = parseNotices(noticesRaw);
    yield put(fetchNoticesSuccess(notices));
    // Bind notices to application while keep one copy notices independently.
    const sortedApplications = bindApplicationsWithNotices(applications, notices);
    yield put(fetchApplicationsSuccess(sortedApplications));
    yield put(updateIsReady(true));
  } catch (e) {
    console.error(e.message);
    yield put(addErrorMessage({ message: e.message }));
    yield put(updateIsReady(true));
  }
}

export function* subscribeToTenant(action: SubscribeToTenantAction): SagaIterator {
  const rootState: RootState = yield select();
  const { email, tenant } = action.payload;

  const baseUrl = rootState.config.keycloakUrl;
  const clientSecret = rootState.config.clientSecret;
  const notificationUrl = rootState.config.serviceUrls?.notificationServiceUrl;

  try {
    const keyCloak = new ServiceTokenApi(baseUrl, clientSecret);

    const token = yield call([keyCloak, keyCloak.getToken]);

    const subscriberApi = new ServiceTokenApi(notificationUrl, clientSecret);

    subscriberApi.setToken(token.access_token);

    const subscribeResponse = yield call([subscriberApi, subscriberApi.subscribe], tenant, email);

    yield put(subscribeToTenantSuccess(subscribeResponse));
  } catch (e) {
    console.error(e.message);
    if (JSON.parse(e.message).codeName === 'DuplicateKey' && JSON.parse(e.message).keyValue.userId) {
      const email = JSON.parse(e.message).keyValue.userId
      yield put(subscribeToTenantSuccess({ addressAs: email, tenantId: `urn:ads:platform:tenant-service:v2:/tenants/${tenant}`}));
    } else {
      yield put(addErrorMessage({ message: e.message }));
    }
  }
}
