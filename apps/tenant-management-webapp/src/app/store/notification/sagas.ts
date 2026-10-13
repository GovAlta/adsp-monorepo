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
import { EventItem, NotificationItem } from './models';
import { UpdateIndicator, UpdateLoadingState } from '@store/session/actions';

import { getAccessToken } from '@store/tenant/sagas';
import { fetchServiceMetrics } from '@store/common';

function* selectNotificationServiceUrl(): SagaIterator {
  return yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
}

function toTypeRecord(types: NotificationItem[]): Record<string, NotificationItem> {
  return Object.fromEntries(types.map((type) => [type.id, type]));
}

export function* fetchNotificationTypes(): SagaIterator {
  const notificationServiceUrl: string = yield call(selectNotificationServiceUrl);
  const token: string = yield call(getAccessToken);

  yield put(
    UpdateLoadingState({
      name: FETCH_NOTIFICATION_CONFIGURATION,
      state: 'start',
    })
  );

  if (notificationServiceUrl && token) {
    try {
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const { data: types } = yield call(
        axios.get,
        `${notificationServiceUrl}/subscription/v1/types?source=tenant`,
        headers
      );
      const {
        data: { fromEmail, ...contact },
      } = yield call(axios.get, `${notificationServiceUrl}/subscription/v1/contact`, headers);

      yield put(FetchNotificationConfigurationSucceededService({ data: toTypeRecord(types) }, contact, { fromEmail }));

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
  const notificationServiceUrl: string = yield call(selectNotificationServiceUrl);
  const token: string = yield call(getAccessToken);

  if (notificationServiceUrl && token) {
    try {
      yield put(
        UpdateIndicator({
          show: true,
        })
      );
      const { data: types } = yield call(axios.get, `${notificationServiceUrl}/subscription/v1/types?source=core`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(FetchCoreNotificationTypeSucceededService({ data: toTypeRecord(types) }));
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

  const notificationServiceUrl: string = yield call(selectNotificationServiceUrl);
  const token: string = yield call(getAccessToken);

  if (notificationServiceUrl && token) {
    try {
      yield call(
        axios.delete,
        `${notificationServiceUrl}/subscription/v1/types/${encodeURIComponent(notificationType.id)}`,
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
  const notificationServiceUrl: string = yield call(selectNotificationServiceUrl);
  const token: string = yield call(getAccessToken);

  const coreNotificationTypes = yield select((state: RootState) => state.notification.core);
  const tenantNotificationTypes = yield select((state: RootState) => state.notification.notificationTypes);

  if (notificationServiceUrl && token) {
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

      const typesUrl = `${notificationServiceUrl}/subscription/v1/types`;
      const typeUrl = `${typesUrl}/${encodeURIComponent(payloadId)}`;
      const headers = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const isCoreType = !!coreNotificationTypes?.[payloadId];
      const isTenantType = !!tenantNotificationTypes?.[payloadId];

      if (payload.events.length === 0 && isCoreType) {
        // Without customized events, the tenant's customization of the core notification type is removed.
        if (isTenantType) {
          yield call(axios.delete, typeUrl, headers);
        }
      } else {
        const definition = {
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
        };

        if (isCoreType || isTenantType) {
          yield call(axios.patch, typeUrl, definition, headers);
        } else {
          yield call(axios.post, typesUrl, definition, headers);
        }
      }

      yield put(FetchNotificationConfigurationService());
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* updateContactInformation({ payload }: UpdateContactInformationAction): SagaIterator {
  const notificationServiceUrl: string = yield call(selectNotificationServiceUrl);
  const token: string = yield call(getAccessToken);

  if (notificationServiceUrl && token) {
    try {
      yield call(
        axios.patch,
        `${notificationServiceUrl}/subscription/v1/contact`,
        {
          contactEmail: payload.contactEmail,
          phoneNumber: payload.phoneNumber,
          supportInstructions: payload.supportInstructions,
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
  const notificationServiceUrl: string = yield call(selectNotificationServiceUrl);
  const token: string = yield call(getAccessToken);

  if (notificationServiceUrl && token) {
    try {
      yield call(
        axios.patch,
        `${notificationServiceUrl}/subscription/v1/contact`,
        { fromEmail: payload.fromEmail },
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
