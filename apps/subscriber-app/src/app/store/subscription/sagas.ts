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
  VERIFY_EMAIL,
  VerifyEmailAction,
  VerifyPhoneAction,
  VERIFY_PHONE,
  CHECK_CODE,
  CheckCodeAction,
  CheckCodeSuccess,
  CheckCodeFailure,
  VerifyEmailSuccess,
  VerifyPhoneSuccess,
} from './actions';
import { UpdateIndicator } from '@store/session/actions';
import { ConfigState } from '@store/config/models';
import { expireMinutes } from '@store/subscription/models';

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
  } catch (err) {
    yield put(
      UpdateIndicator({
        show: false,
        message: '',
        action: '',
      })
    );
    yield put(ErrorNotification({ error: err }));
  }
}

function* createSubscriber(_action: CreateSubscribeAction): SagaIterator {
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
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
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
    } catch (err) {
      if (action.payload.action) {
        yield put(
          UpdateIndicator({
            show: false,
            message: '',
            action: '',
          })
        );
      }
      yield put(ErrorNotification({ message: 'failed to updated contact information', error: err }));
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
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
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
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* verifyPhone(action: VerifyPhoneAction): SagaIterator {
  const subscriber = action.subscriber;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);

  const token: string = yield select((state: RootState) =>
    action.nonLoggedIn ? 'none' : state.session.credentials?.token
  );

  const realm: string = yield select((state: RootState) => (action.nonLoggedIn ? null : state.session.realm));
  const baseUrl = action.nonLoggedIn ? '/api/subscriber' : `${configBaseUrl}/subscription`;
  const reason = `This code will expire in ${expireMinutes} minutes, so please make sure to click it soon to confirm the accuracy of your notification phone number. Please disregard this sms if you did not initiate the verification.`;
  const address = subscriber.channels.find((channel) => channel.channel === 'sms')?.address;

  const loggedInLink = `${window.location.origin}/subscriptions/${realm}`;

  if (baseUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${baseUrl}/v1/subscribers/${subscriber.id}`,
        {
          operation: 'send-code-with-link',
          channel: 'sms',
          address: address,
          reason: reason,
          verificationLink: loggedInLink,
          expireIn: expireMinutes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(
        SuccessNotification({
          message: `A verification sms has been sent to ${address}. If you did not receive this message, adjust the phone number and try again. The code will expire after ${expireMinutes} minutes`,
        })
      );
      yield put(VerifyPhoneSuccess(response));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* verifyEmail(action: VerifyEmailAction): SagaIterator {
  const subscriber = action.subscriber;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const realm: string = yield select((state: RootState) => (action.nonLoggedIn ? null : state.session.realm));
  const token: string = yield select((state: RootState) =>
    action.nonLoggedIn ? 'none' : state.session.credentials?.token
  );

  let data = {};

  if (action.nonLoggedIn) {
    const configState: ConfigState = yield select((state: RootState) => state.config);
    let recaptchaToken = null;
    const grecaptcha = configState.grecaptcha;

    if (grecaptcha) {
      recaptchaToken = yield call([grecaptcha, grecaptcha.execute], configState.recaptchaKey, {
        action: 'subscription_verify_email',
      });

      data = {
        token: recaptchaToken,
      };
    }
  }

  const baseUrl = action.nonLoggedIn ? '/api/subscriber' : `${configBaseUrl}/subscription`;
  const loggedInLink = `${window.location.origin}/${action.nonLoggedIn ? subscriber.id : `${realm}/login`}`;
  const loggedOutLink = `${window.location.origin}/${action.subscriber.id}`;

  const link = action.nonLoggedIn ? loggedOutLink : loggedInLink;

  const reason = `The code will expire in ${expireMinutes} minutes, so please make sure to click the link soon to confirm the accuracy of your notification email. Please disregard this email if you did not initiate the verification.`;

  const address = subscriber.channels.find((channel) => channel.channel === 'email')?.address;

  if (baseUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${baseUrl}/v1/subscribers/${subscriber.id}`,
        {
          operation: 'send-code-with-link',
          channel: 'email',
          address: address,
          reason: reason,
          verificationLink: link,
          expireIn: expireMinutes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          data,
        }
      );

      yield put(
        SuccessNotification({
          message: `A verification email has been sent to ${address}. If you did not receive this message, adjust the email and try again. The code will expire after ${expireMinutes} minutes`,
        })
      );
      yield put(VerifyEmailSuccess(response));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* checkCode(action: CheckCodeAction): SagaIterator {
  const subscriber = action.subscriber;
  const code = action.code;
  const givenChannel = action.channel;

  const configBaseUrl: string = yield select((state: RootState) =>
    action.nonLoggedIn ? null : state.config.serviceUrls?.notificationServiceUrl
  );
  const token: string = yield select((state: RootState) =>
    action.nonLoggedIn ? 'none' : state.session.credentials?.token
  );

  let data = {};

  if (action.nonLoggedIn) {
    const configState: ConfigState = yield select((state: RootState) => state.config);
    let recaptchaToken = null;
    const grecaptcha = configState.grecaptcha;

    if (grecaptcha) {
      recaptchaToken = yield call([grecaptcha, grecaptcha.execute], configState.recaptchaKey, {
        action: 'subscription_check_code',
      });

      data = {
        token: recaptchaToken,
      };
    }
  }

  const baseUrl = action.nonLoggedIn ? '/api/subscriber' : `${configBaseUrl}/subscription`;

  const channelIndex = subscriber.channels.findIndex((channel) => channel.channel === givenChannel);
  try {
    const response = yield call(
      axios.post,
      `${baseUrl}/v1/subscribers/${subscriber.id}`,
      {
        operation: 'verify-channel',
        channel: givenChannel,
        address: subscriber.channels.find((channel) => channel.channel === givenChannel)?.address,
        code: code,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        data,
      }
    );

    if (response.data?.verified) {
      yield put(CheckCodeSuccess({ channelIndex }));

      yield put(
        SuccessNotification({
          message: `Verification for ${subscriber.channels[channelIndex]?.address} is successful .`,
        })
      );
    } else {
      yield put(ErrorNotification({ message: 'The code you have entered is incorrect' }));
      yield put(CheckCodeFailure({ channelIndex }));
    }
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(GET_MY_SUBSCRIBER_DETAILS, getMySubscriberDetails);
  yield takeEvery(GET_SUBSCRIBER_DETAILS, getSubscriberDetails);
  yield takeEvery(UNSUBSCRIBE, unsubscribe);
  yield takeEvery(SIGNED_OUT_UNSUBSCRIBE, signedOutUnsubscribe);
  yield takeEvery(PATCH_SUBSCRIBER, patchSubscriber);
  yield takeEvery(CREATE_SUBSCRIBER, createSubscriber);
  yield takeEvery(VERIFY_EMAIL, verifyEmail);
  yield takeEvery(VERIFY_PHONE, verifyPhone);
  yield takeEvery(CHECK_CODE, checkCode);
}
