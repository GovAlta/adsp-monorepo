import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ApplicationApi, SubscriberApi } from './api';
import {
  fetchApplicationsSuccess,
  FetchApplicationsAction,
  fetchNoticesSuccess,
  SubscribeToTenantAction,
  subscribeToTenantSuccess,
  FetchContactInfoAction,
  FetchContactInfoSucceededService,
} from './actions';
import { parseNotices, bindApplicationsWithNotices } from './models';
import { addErrorMessage, updateIsReady, updateTenantName } from '@store/session/actions';
import { SagaIterator } from '@redux-saga/core';
import { toTenantName } from './models';
import { ConfigState } from '@store/config/models';
import axios from 'axios';

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
  const { email, tenant } = action.payload;

  try {
    const configState: ConfigState = yield select((state: RootState) => state.config);

    let token = null;
    const grecaptcha = configState.grecaptcha;
    if (grecaptcha) {
      token = yield call([grecaptcha, grecaptcha.execute], configState.recaptchaKey, {
        action: 'subscribe_status',
      });
    }

    const subscriberApi = new SubscriberApi('/api/subscriber/v1');
    const subscriber = yield call([subscriberApi, subscriberApi.subscribe], tenant, email, token);

    yield put(subscribeToTenantSuccess(subscriber));
  } catch (e) {
    yield put(addErrorMessage({ message: e.message }));
  }
}

export function* fetchContactInfo(action: FetchContactInfoAction): SagaIterator {
  const { name } = action.payload;

  try {
    const contactInfo = (yield call(axios.get, `/api/configuration/v1/status-support-info/${name}`)).data;

    yield put(FetchContactInfoSucceededService(contactInfo));
  } catch (e) {
    yield put(addErrorMessage({ message: `${e.message} - fetchContactInfo` }));
  }
}
