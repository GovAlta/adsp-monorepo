import { put, select, call, takeEvery, takeLatest } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import {
  FetchNotificationConfigurationSucceededService,
  FetchCoreNotificationTypeSucceededService,
  FetchNotificationConfigurationService,
  DeleteNotificationTypeAction,
  UpdateNotificationTypeAction,
  UpdateContactInformationAction,
  DELETE_NOTIFICATION_TYPE,
  FETCH_NOTIFICATION_CONFIGURATION,
  FETCH_CORE_NOTIFICATION_TYPES,
  UPDATE_NOTIFICATION_TYPE,
  UPDATE_CONTACT_INFORMATION,
  FETCH_NOTIFICATION_METRICS,
  FetchNotificationMetricsSucceeded,
} from './actions';

import { RootState } from '../index';
import axios from 'axios';
import moment from 'moment';
import { EventItem } from './models';

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
      if (configuration.latest) {
        const { contact, ...notificationTypeInfo } = configuration.latest.configuration;
        yield put(FetchNotificationConfigurationSucceededService({ data: notificationTypeInfo }, contact));
      }
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
      yield put(ErrorNotification({ message: `${e.message} - fetchCoreNotificationTypes` }));
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
      yield put(FetchNotificationConfigurationService());
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
      const payloadId = payload.id;

      const sanitizedEvents = payload.events.map((eve) => {
        const eventBuilder: EventItem = {
          namespace: eve.namespace,
          name: eve.name,
          templates: eve.templates,
        };
        return eventBuilder;
      });

      payload.events = sanitizedEvents;

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
              channels: payload.channels || ['email'], //TODO: This is for 'migration' of pre-existing types.
              events: payload.events,
              publicSubscribe: payload.publicSubscribe,
              manageSubscribe: payload.manageSubscribe,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchNotificationConfigurationService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateNotificationType` }));
    }
  }
}

export function* updateContactInformation({ payload }: UpdateContactInformationAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        {
          operation: 'UPDATE',
          update: {
            contact: {
              contactEmail: payload.contactEmail,
              phoneNumber: payload.phoneNumber,
              supportInstructions: payload.supportInstructions,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchNotificationConfigurationService());
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
        metricLike: 'notification-service',
      });

      const { data: metrics }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sentMetric = 'notification-service:notification-sent:count';
      const failedMetric = 'notification-service:notification-send-failed:count';
      yield put(
        FetchNotificationMetricsSucceeded({
          notificationsSent: parseInt(metrics[sentMetric]?.values[0]?.sum || '0'),
          notificationsFailed: parseInt(metrics[failedMetric]?.values[0]?.sum || '0'),
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationMetrics` }));
    }
  }
}

export function* watchNotificationSagas(): Generator {
  yield takeEvery(FETCH_NOTIFICATION_CONFIGURATION, fetchNotificationTypes);
  yield takeEvery(FETCH_CORE_NOTIFICATION_TYPES, fetchCoreNotificationTypes);
  yield takeEvery(DELETE_NOTIFICATION_TYPE, deleteNotificationTypes);
  yield takeEvery(UPDATE_NOTIFICATION_TYPE, updateNotificationType);
  yield takeEvery(UPDATE_CONTACT_INFORMATION, updateContactInformation);
  yield takeLatest(FETCH_NOTIFICATION_METRICS, fetchNotificationMetrics);
}
