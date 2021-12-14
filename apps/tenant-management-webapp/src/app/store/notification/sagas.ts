import { put, select, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import { v4 as uuidv4 } from 'uuid';
import {
  FetchNotificationTypeSucceededService,
  FetchCoreNotificationTypeSucceededService,
  FetchNotificationTypeService,
  DeleteNotificationTypeAction,
  UpdateNotificationTypeAction,
  DELETE_NOTIFICATION_TYPE,
  FETCH_NOTIFICATION_TYPE,
  FETCH_CORE_NOTIFICATION_TYPE,
  UPDATE_NOTIFICATION_TYPE,
} from './actions';

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

export function* fetchCoreNotificationTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service?core`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const notificationTypeInfo = configuration.latest && configuration.latest.configuration;
      yield put(FetchCoreNotificationTypeSucceededService({ data: notificationTypeInfo }));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* deleteNotificationTypes(action: DeleteNotificationTypeAction): SagaIterator {
  const notificationType = action.payload;

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        { operation: 'DELETE', property: notificationType.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(FetchNotificationTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.response.data} - deleteNotificationTypes` }));
    }
  }
}

export function* updateNotificationType({ payload }: UpdateNotificationTypeAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const payloadId = payload.id || uuidv4();

      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        {
          operation: 'UPDATE',
          update: {
            [payloadId]: {
              id: payloadId,
              name: payload.name,
              description: payload.description,
              subscriberRoles: payload.subscriberRoles,
              events: payload.events,
              publicSubscribe: payload.publicSubscribe,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchNotificationTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateNotificationType` }));
    }
  }
}

export function* watchNotificationSagas(): Generator {
  yield takeEvery(FETCH_NOTIFICATION_TYPE, fetchNotificationTypes);
  yield takeEvery(FETCH_CORE_NOTIFICATION_TYPE, fetchCoreNotificationTypes);
  yield takeEvery(DELETE_NOTIFICATION_TYPE, deleteNotificationTypes);
  yield takeEvery(UPDATE_NOTIFICATION_TYPE, updateNotificationType);
}
