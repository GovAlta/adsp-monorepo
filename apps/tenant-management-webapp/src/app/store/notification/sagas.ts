import { put, select, call, takeEvery, takeLatest } from 'redux-saga/effects';
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
  FETCH_NOTIFICATION_METRICS,
  fetchNotificationMetricsSucceeded,
} from './actions';

import { RootState } from '../index';
import axios from 'axios';
import moment from 'moment';

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

interface MetricResponse {
  values: { sum: string }[];
}

export function* fetchNotificationMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
      });

      let metric = 'notification-service:notification-sent:count';
      const { data: sentMetric }: { data: MetricResponse } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics/${metric}?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      metric = 'notification-service:notification-send-failed:count';
      const { data: failedMetric }: { data: MetricResponse } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics/${metric}?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      yield put(
        fetchNotificationMetricsSucceeded({
          notificationsSent: parseInt(sentMetric.values[0]?.sum || '0'),
          notificationsFailed: parseInt(failedMetric.values[0]?.sum || '0'),
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationMetrics` }));
    }
  }
}

export function* watchNotificationSagas(): Generator {
  yield takeEvery(FETCH_NOTIFICATION_TYPE, fetchNotificationTypes);
  yield takeEvery(FETCH_CORE_NOTIFICATION_TYPE, fetchCoreNotificationTypes);
  yield takeEvery(DELETE_NOTIFICATION_TYPE, deleteNotificationTypes);
  yield takeEvery(UPDATE_NOTIFICATION_TYPE, updateNotificationType);
  yield takeLatest(FETCH_NOTIFICATION_METRICS, fetchNotificationMetrics);
}
