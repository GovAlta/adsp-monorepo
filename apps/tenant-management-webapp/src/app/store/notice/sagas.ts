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
import { Session } from '@store/session/models';
import { ConfigState } from '@store/config/models';
import { NoticesResult, Notice } from './models';
import { SagaIterator } from '@redux-saga/core';

export function* saveNotice(action: SaveNoticeAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new NoticeApi(baseUrl, token);
    const data = yield call([api, api.saveNotice], action.payload);
    yield put(saveNoticeSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* getNotices(): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

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
  const token = getToken(currentState.session);

  try {
    const api = new NoticeApi(baseUrl, token);
    const notice: Notice = yield call([api, api.deleteNotice], action.payload);
    yield put(deleteNoticeSuccess(notice));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

function getToken(session: Session): string {
  return session?.credentials?.token;
}

function getServiceStatusUrl(config: ConfigState): string {
  return config.serviceUrls.serviceStatusApiUrl;
}
