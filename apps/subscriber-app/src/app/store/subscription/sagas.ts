import { put, select, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification, SuccessNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import {
  GET_MY_SUBSCRIBER_DETAILS,
  GET_SUBSCRIBER_DETAILS,
  GetSubscriberDetailsSuccess,
  UNSUBSCRIBE,
  SIGNED_OUT_UNSUBSCRIBE,
  UnsubscribeAction,
  UnsubscribeSuccess,
  PatchSubscriberAction,
  GetSubscriberAction,
  PatchSubscriberSuccess,
  PATCH_SUBSCRIBER,
  NoSubscriberAction,
  GetSignedOutSubscriberAction,
  CREATE_SUBSCRIBER,
  CreateSubscribeAction,
  createSubscriberSuccess,
} from './actions';
import { UpdateIndicator } from '@store/session/actions';
import { ConfigState } from '@store/config/models';

import { RootState } from '../index';
import axios from 'axios';

export function* getMySubscriberDetails(): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const { data } = yield call(
        axios.get,
        `${configBaseUrl}/subscription/v1/subscribers/my-subscriber?includeSubscriptions=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data) {
        yield put(GetSubscriberDetailsSuccess(data));
      }
    } catch (e) {
      yield put(NoSubscriberAction());
    }
  }
}

export function* getSubscriberDetails(action: GetSubscriberAction): SagaIterator {
  try {
    yield put(
      UpdateIndicator({
        show: true,
        message: '',
        action: action.payload.subscriberId,
      })
    );

    const subscriberId = action.payload.subscriberId;
    const { data } = yield call(axios.get, `/api/subscriber/v1/get-subscriber/${subscriberId}`);

    if (data) {
      yield put(GetSubscriberDetailsSuccess(data));
    }
    yield put(
      UpdateIndicator({
        show: false,
        message: '',
        action: '',
      })
    );
  } catch (e) {
    yield put(
      UpdateIndicator({
        show: false,
        message: '',
        action: '',
      })
    );
    yield put(ErrorNotification({ message: `${e.response.data.errorMessage ?? e.message}` }));
  }
}

function* createSubscriber(action: CreateSubscribeAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const email: string = yield select((state: RootState) => state.session.userInfo.email);

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${configBaseUrl}/subscription/v1/subscribers?userSub=true`,
        { data: 'data' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(createSubscriberSuccess(response.data));

      yield put(
        SuccessNotification({
          message: `You are subscribed! You will receive notifications on ${email} .`,
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `Subscriptions (addTypeSubscription): ${e.message}` }));
    }
  }
}

export function* patchSubscriber(action: PatchSubscriberAction): SagaIterator {
  const channels = action.payload.channels;
  const subscriberId = action.payload.subscriberId;
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (action.payload.action) {
    yield put(
      UpdateIndicator({
        show: true,
        message: '',
        action: action.payload.action,
      })
    );
  }

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

      if (action.payload.action) {
        yield put(
          UpdateIndicator({
            show: false,
            message: '',
            action: '',
          })
        );
      }
    } catch (e) {
      if (action.payload.action) {
        yield put(
          UpdateIndicator({
            show: false,
            message: '',
            action: '',
          })
        );
      }
      yield put(ErrorNotification({ message: `${e.message} - failed to updated contact information` }));
    }
  }
}

export function* unsubscribe(action: UnsubscribeAction): SagaIterator {
  const type = action.payload.type;
  const id = action.payload.subscriberId;

  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);

  if (configBaseUrl && token) {
    try {
      yield call(axios.delete, `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // remove the deleted subscription from the list after its successful
      yield put(UnsubscribeSuccess(type));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - failed to delete subscription` }));
    }
  }
}

export function* signedOutUnsubscribe(action: GetSignedOutSubscriberAction): SagaIterator {
  const type = action.payload.type;
  const id = action.payload.subscriberId;
  const tenantId = action.payload.tenantId;

  const configState: ConfigState = yield select((state: RootState) => state.config);
  let recaptchaToken = null;
  const grecaptcha = configState.grecaptcha;

  if (grecaptcha) {
    recaptchaToken = yield call([grecaptcha, grecaptcha.execute], configState.recaptchaKey, {
      action: 'subscription_unsubscribe',
    });
  }

  try {
    yield call(axios.delete, `/api/subscriber/v1/types/${type}/subscriptions/${id}?tenantId=${tenantId}`, {
      data: {
        token: recaptchaToken,
      },
    });

    yield put(UnsubscribeSuccess(type));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
  }
}

export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(GET_MY_SUBSCRIBER_DETAILS, getMySubscriberDetails);
  yield takeEvery(GET_SUBSCRIBER_DETAILS, getSubscriberDetails);
  yield takeEvery(UNSUBSCRIBE, unsubscribe);
  yield takeEvery(SIGNED_OUT_UNSUBSCRIBE, signedOutUnsubscribe);
  yield takeEvery(PATCH_SUBSCRIBER, patchSubscriber);
  yield takeEvery(CREATE_SUBSCRIBER, createSubscriber);
}
