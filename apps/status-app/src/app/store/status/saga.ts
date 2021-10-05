import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ApplicationApi } from './api';
import { fetchApplicationsSuccess, FetchApplicationsAction, fetchNoticesSuccess } from './actions';
import { parseNotices, bindApplicationsWithNotices } from './models';
import { addErrorMessage, updateIsReady } from '@store/session/actions';
import { SagaIterator } from '@redux-saga/core';

export function* fetchApplications(action: FetchApplicationsAction): SagaIterator {
  const rootState: RootState = yield select();
  const name = action.payload;
  const baseUrl = rootState.config.serviceUrls.serviceStatusApiUrl;

  try {
    const api = new ApplicationApi(baseUrl);
    yield put(updateIsReady(false));
    const unKebabName = name.replace(/-/g, ' ');
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