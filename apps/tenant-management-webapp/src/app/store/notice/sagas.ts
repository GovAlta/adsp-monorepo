import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { NoticeApi } from './api';
import {
  saveNoticeSuccess,
  getNoticesSuccess,
  deleteNoticeSuccess,
  SaveNoticeAction,
  DeleteNoticeAction,
} from './actions';
import { UpdateIndicator } from '@store/session/actions';
import { ConfigState } from '@store/config/models';
import { NoticesResult, Notice } from './models';
import { SagaIterator } from '@redux-saga/core';
import { getAccessToken } from '@store/tenant/sagas';

export function* saveNotice(action: SaveNoticeAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    yield put(UpdateIndicator({ show: true }));
    const api = new NoticeApi(baseUrl, token);
    const data = yield call([api, api.saveNotice], action.payload);
    yield put(saveNoticeSuccess(data));
    yield put(UpdateIndicator({ show: false }));
  } catch (e) {
    yield put(UpdateIndicator({ show: false }));
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* getNotices(): SagaIterator {
  const currentState: RootState = yield select();
  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new NoticeApi(baseUrl, token);
    const notices: NoticesResult = yield call([api, api.getNotices]);
    yield put(getNoticesSuccess(notices.results));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* deleteNotice(action: DeleteNoticeAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    yield put(UpdateIndicator({ show: true }));
    const api = new NoticeApi(baseUrl, token);
    const notice: Notice = yield call([api, api.deleteNotice], action.payload);
    yield put(deleteNoticeSuccess(notice));
    yield put(UpdateIndicator({ show: false }));
  } catch (e) {
    yield put(UpdateIndicator({ show: false }));
    yield put(ErrorNotification({ message: e.message }));
  }
}

function getServiceStatusUrl(config: ConfigState): string {
  return config.serviceUrls.serviceStatusApiUrl;
}
