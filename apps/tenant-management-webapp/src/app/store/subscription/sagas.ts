import { put, select, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import {
  CREATE_SUBSCRIBER,
  SUBSCRIBE_SUBSCRIBER,
  GET_SUBSCRIBER,
  SubscribeSubscriberService,
  SubscribeSubscriberSuccess,
  GetSubscriberSuccess,
  CreateSubscriberAction,
  SubscribeSubscriberServiceAction,
  UnsubscribeSuccess,
  UNSUBSCRIBE,
  GET_SUBSCRIPTION,
  UnsubscribeAction,
  GetSubscriptionAction,
  GetSubscriptionSuccess,
  FindSubscribersAction,
  FindSubscribersSuccess
} from './actions';
import { Subscription, Subscriber } from './models';

import { RootState } from '../index';
import axios from 'axios';

export function* getSubscription(action: GetSubscriptionAction): SagaIterator {
  const type = action.payload.subscriptionInfo.data.type;
  const id = action.payload.subscriptionInfo.data.data.id;
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = response.data?.subscriber;

      if (result) {
        const subData: Subscription = {
          id: result.id,
          urn: result.urn,
        };

        yield put(GetSubscriptionSuccess(subData));
      } else {
        yield put(GetSubscriptionSuccess(result));
      }
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

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

export function* createSubscriber(action: CreateSubscriberAction): SagaIterator {
  const type = action.payload.notificationName;
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.post,
        `${configBaseUrl}/subscription/v1/subscribers`,
        { data: 'data' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(SubscribeSubscriberService({ data: { type: type } }));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* addTypeSubscription(action: SubscribeSubscriberServiceAction): SagaIterator {
  const type = action.payload.notificationInfo.data.type;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const email: string = yield select((state: RootState) => state.session.userInfo.email);

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${configBaseUrl}/subscription/v1/types/${type}/subscriptions?userSub=true`,
        { data: 'data' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = response.data.subscriber;

      const subData: Subscriber = {
        id: result.id,
        urn: result.urn,
        channels: result.channels,
      };

      yield put(SubscribeSubscriberSuccess({ data: { type: type, data: subData, email: email } }));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* unsubscribe(action: UnsubscribeAction): SagaIterator {
  const type = action.payload.subscriptionInfo.data.type;
  const id = action.payload.subscriptionInfo.data.data.id;
  const subscriber = action.payload.subscriptionInfo.data.data;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(axios.delete, `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(UnsubscribeSuccess(subscriber));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* findSubscribers(action: FindSubscribersAction): SagaIterator {
  //const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);

  const configBaseUrl: string = "http://localhost:3335"

  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const findSubscriberPath = 'subscription/v1/subscribers';
  const criteria = action.payload;
  const params: any = {}
  if (criteria.email) {
    params.email = criteria.email;
  }

  if (criteria.name) {
    params.name = criteria.name;
  }

  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, `${configBaseUrl}/${findSubscriberPath}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      const subscribers = response.data.results;
      yield put(FindSubscribersSuccess(subscribers));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - find subscribers` }));
    }
  }
}

export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(CREATE_SUBSCRIBER, createSubscriber);
  yield takeEvery(SUBSCRIBE_SUBSCRIBER, addTypeSubscription);
  yield takeEvery(GET_SUBSCRIBER, getSubscriber);
  yield takeEvery(UNSUBSCRIBE, unsubscribe);
  yield takeEvery(GET_SUBSCRIPTION, getSubscription);
}