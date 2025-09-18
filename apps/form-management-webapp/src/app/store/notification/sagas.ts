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
  UpdateEmailInformationAction,
  UPDATE_EMAIL_INFORMATION,
} from './actions';

import { RootState } from '../index';
import axios from 'axios';
import { EventItem } from './models';
import { UpdateIndicator, UpdateLoadingState } from '@store/session/actions';

import { getAccessToken } from '@store/tenant/sagas';
import { fetchServiceMetrics } from '@store/common';

export function* fetchNotificationTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  yield put(
    UpdateLoadingState({
      name: FETCH_NOTIFICATION_CONFIGURATION,
      state: 'start',
    })
  );

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
        const { contact, email: fromEmail, ...notificationTypeInfo } = configuration.latest.configuration;
        yield put(FetchNotificationConfigurationSucceededService({ data: notificationTypeInfo }, contact, fromEmail));
      }

      yield put(
        UpdateLoadingState({
          name: FETCH_NOTIFICATION_CONFIGURATION,
          state: 'completed',
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));

      yield put(
        UpdateLoadingState({
          name: FETCH_NOTIFICATION_CONFIGURATION,
          state: 'error',
        })
      );
    }
  }
}

export function* fetchCoreNotificationTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      yield put(
        UpdateIndicator({
          show: true,
        })
      );
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service?core`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const notificationTypeInfo = configuration.latest && configuration.latest.configuration;

      yield put(FetchCoreNotificationTypeSucceededService({ data: notificationTypeInfo }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* deleteNotificationTypes(action: DeleteNotificationTypeAction): SagaIterator {
  const notificationType = action.payload;

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

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
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* updateNotificationType({ payload }: UpdateNotificationTypeAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  const coreNotificationTypes = yield select((state: RootState) => state.notification.core);

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

      const url = `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`;
      const headers = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (
        payload.events.length === 0 &&
        coreNotificationTypes &&
        Object.keys(coreNotificationTypes).includes(payloadId)
      ) {
        // If there is no events in the custom "core" notification type, we need to clean up the custom notification type.
        const config = (yield call(axios.get, url, headers)).data.latest.configuration;
        delete config[payloadId];

        yield call(
          axios.patch,
          url,
          {
            operation: 'REPLACE',
            configuration: config,
          },
          headers
        );
      } else {
        yield call(
          axios.patch,
          url,
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
                address: payload.address,
                addressPath: payload.addressPath,
                bccPath: payload.bccPath,
                ccPath: payload.ccPath,
                attachmentPath: payload.attachmentPath,
              },
            },
          },
          headers
        );
      }

      yield put(FetchNotificationConfigurationService());
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* updateContactInformation({ payload }: UpdateContactInformationAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

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
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* updateEmailInformation({ payload }: UpdateEmailInformationAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        {
          operation: 'UPDATE',
          update: {
            email: {
              fromEmail: payload.fromEmail,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchNotificationConfigurationService());
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* fetchNotificationMetrics(): SagaIterator {
  yield* fetchServiceMetrics('notification-service', function* (metrics) {
    const sentMetric = 'notification-service:notification-sent:count';
    const failedMetric = 'notification-service:notification-send-failed:count';
    const sendDurationMetric = 'notification-service:notification-send:duration';

    yield put(
      FetchNotificationMetricsSucceeded({
        notificationsSent: parseInt(metrics[sentMetric]?.values[0]?.sum || '0'),
        notificationsFailed: parseInt(metrics[failedMetric]?.values[0]?.sum || '0'),
        sendDuration: metrics[sendDurationMetric]?.values[0]
          ? parseInt(metrics[sendDurationMetric]?.values[0].avg)
          : null,
      })
    );
  });
}

export function* watchNotificationSagas(): Generator {
  yield takeEvery(FETCH_NOTIFICATION_CONFIGURATION, fetchNotificationTypes);
  yield takeEvery(FETCH_CORE_NOTIFICATION_TYPES, fetchCoreNotificationTypes);
  yield takeEvery(DELETE_NOTIFICATION_TYPE, deleteNotificationTypes);
  yield takeEvery(UPDATE_NOTIFICATION_TYPE, updateNotificationType);
  yield takeEvery(UPDATE_CONTACT_INFORMATION, updateContactInformation);
  yield takeEvery(UPDATE_EMAIL_INFORMATION, updateEmailInformation);
  yield takeLatest(FETCH_NOTIFICATION_METRICS, fetchNotificationMetrics);
}
