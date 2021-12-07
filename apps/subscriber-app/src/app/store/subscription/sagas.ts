import { put, select, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import {
  GET_SUBSCRIBER,
  GetSubscriberSuccess,
  UnsubscribeSuccess,
  UNSUBSCRIBE,
  UnsubscribeAction,
  GET_SUBSCRIPTION_TYPES_SUCCESS,
  GET_SUBSCRIPTION_TYPES,
  GetSubsciptionTypesSuccess,
} from './actions';
import { Subscription, Subscriber } from './models';

import { RootState } from '../index';
import axios from 'axios';

export function* getSubscriber(): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, `${configBaseUrl}/subscription/v1/subscribers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = response.data?.results[0];

      if (result) {
        const subData: Subscriber = {
          id: result.id,
          urn: result.urn,
          channels: result.channels,
        };

        yield put(GetSubscriberSuccess(subData));
      } else {
        yield put(GetSubscriberSuccess(result));
      }
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* unsubscribe(action: UnsubscribeAction): SagaIterator {
  const type = action.payload.subscriptionInfo.data.type;
  const id = action.payload.subscriptionInfo.data.data.id;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const data = yield call(axios.delete, `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(UnsubscribeSuccess(data.data?.deleted));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* getSubscriptionTypes(): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, `${configBaseUrl}/subscription/v1/types`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = response.data;

      if (result) {
        yield put(GetSubsciptionTypesSuccess(result));
      }
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(GET_SUBSCRIBER, getSubscriber);
  yield takeEvery(UNSUBSCRIBE, unsubscribe);
  yield takeEvery(GET_SUBSCRIPTION_TYPES, getSubscriptionTypes);
}
