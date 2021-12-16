import { put, select, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import { GET_MY_SUBSCRIBER_DETAILS, GetMySubscriberDetailsSuccess } from './actions';
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

export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(GET_MY_SUBSCRIBER_DETAILS, getMySubscriberDetails);
}
