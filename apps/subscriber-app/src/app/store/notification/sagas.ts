import { put, select, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import { FetchNotificationTypeSucceededService, FETCH_NOTIFICATION_TYPE } from './actions';
import { RootState } from '../index';
import axios from 'axios';

export function* fetchNotificationTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const notificationTypeInfo = configuration.latest && configuration.latest.configuration;
      yield put(FetchNotificationTypeSucceededService({ data: notificationTypeInfo }));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* watchNotificationSagas(): Generator {
  yield takeEvery(FETCH_NOTIFICATION_TYPE, fetchNotificationTypes);
}
