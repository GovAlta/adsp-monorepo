import { put, select, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification, SuccessNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import {
  GET_MY_SUBSCRIBER_DETAILS,
  GET_SUBSCRIBER_DETAILS,
  GetMySubscriberDetailsSuccess,
  GetSubscriberDetailsSuccess,
  UNSUBSCRIBE,
  UnsubscribeAction,
  UnsubscribeSuccess,
  PatchSubscriberAction,
  GetSubscriberAction,
  PatchSubscriberSuccess,
  PATCH_SUBSCRIBER,
} from './actions';
import { Subscriber } from './models';

import { RootState } from '../index';
import axios from 'axios';

export function* getMySubscriberDetails(): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.get,
        `${configBaseUrl}/subscription/v1/subscribers/my-subscriber?includeSubscriptions=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result: Subscriber = response.data;

      if (result) {
        yield put(GetMySubscriberDetailsSuccess(result));
      }
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* getSubscriberDetails(action: GetSubscriberAction): SagaIterator {
  console.log(JSON.stringify('here'));

  try {
    const subscriberId = action.payload.subscriberId;

    console.log(JSON.stringify(subscriberId) + '<subscriberIdxxx');

    const { data } = yield call(axios.get, `/api/subscriber/v1/get-subscriber/${subscriberId}`);

    //const subscriber: Subscriber = data;

    console.log(JSON.stringify(data) + '<subscribersubscriber');
    if (data) {
      yield put(GetSubscriberDetailsSuccess(data));
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
  }
}

export function* patchSubscriber(action: PatchSubscriberAction): SagaIterator {
  const channels = action.payload.channels;
  const subscriberId = action.payload.subscriberId;
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.patch,
        `${configBaseUrl}/subscription/v1/subscribers/${subscriberId}`,
        { channels },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(
        SuccessNotification({
          message: 'Contact information updated.',
        })
      );
      // updated channel information for the subscriber
      yield put(PatchSubscriberSuccess(response.data));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - failed to updated contact information` }));
    }
  }
}

export function* unsubscribe(action: UnsubscribeAction): SagaIterator {
  const type = action.payload.type;
  const id = action.payload.subscriberId;
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(axios.delete, `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(
        SuccessNotification({
          message: 'Subscription removed.',
        })
      );
      // remove the deleted subscription from the list after its successful
      yield put(UnsubscribeSuccess(type));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - failed to delete subscription` }));
    }
  }
}
export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(GET_MY_SUBSCRIBER_DETAILS, getMySubscriberDetails);
  yield takeEvery(GET_SUBSCRIBER_DETAILS, getSubscriberDetails);
  yield takeEvery(UNSUBSCRIBE, unsubscribe);
  yield takeEvery(PATCH_SUBSCRIBER, patchSubscriber);
}
