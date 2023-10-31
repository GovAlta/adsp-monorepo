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
  CHECK_CODE,
  CheckCodeAction,
  CheckCodeSuccess,
  CheckCodeFailure,
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

export function* verifyEmail(action: VerifyEmailAction): SagaIterator {
  const subscriber = action.subscriber;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const realm: string = yield select((state: RootState) => state.session.realm);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const email: string = yield select((state: RootState) => state.session.userInfo.email);

  console.log(JSON.stringify(token) + '<token');
  console.log(JSON.stringify(email) + '<email');
  console.log(JSON.stringify(configBaseUrl) + '<configBaseUrl');
  console.log(
    JSON.stringify(subscriber.channels.find((channel) => channel.channel === 'email')?.address) +
      '<subscriber.channels.find((channel) => channel.channel ==='
  );

  const link = `${window.location.origin}/${realm}/login`;

  const reason = `Verification Link: ${link} - This link will expire in 1 hour, so please make sure to click it soon to confirm the accuracy of your notification email/phone number. Verifying this information is essential to ensure that you continue to receive important updates and notifications from us. Thank you for your prompt attention to this matter. If you have any questions or encounter any issues during the verification process, please do not hesitate to contact our support team at [Support Email Address] or [Support Phone Number]. Your security and privacy are of utmost importance to us, and this verification process is designed to enhance the protection of your account.`;

  const address = subscriber.channels.find((channel) => channel.channel === 'email')?.address;

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${configBaseUrl}/subscription/v1/subscribers/${subscriber.id}`,
        {
          operation: 'send-code',
          channel: 'email',
          address: address,
          reason: reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(JSON.stringify(response) + ' <response');

      yield put(
        SuccessNotification({
          message: `A verification email has been sent to ${address}..`,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* checkCode(action: CheckCodeAction): SagaIterator {
  const subscriber = action.subscriber;
  const code = action.code;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const email: string = yield select((state: RootState) => state.session.userInfo.email);

  console.log(JSON.stringify(token) + '<token');
  console.log(JSON.stringify(email) + '<email');
  console.log(JSON.stringify(code) + '<codexx');
  console.log(JSON.stringify(action) + '<actionx');
  console.log(JSON.stringify(configBaseUrl) + '<configBaseUrl');
  console.log(
    JSON.stringify(subscriber.channels.find((channel) => channel.channel === 'email')?.address) +
      '<subscriber.channels.find((channel) => channel.channel ==='
  );

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${configBaseUrl}/subscription/v1/subscribers/${subscriber.id}`,
        {
          operation: 'verify-channel',
          channel: 'email',
          address: subscriber.channels.find((channel) => channel.channel === 'email')?.address,
          code: code,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(JSON.stringify(response) + ' <response checkCode');

      if (response.data.verified) {
        yield put(CheckCodeSuccess(response.data));

      

        // update subscriber  //
     
          const channelIndex = subscriber.channels.findIndex((channel) => channel.channel === 'email');
          subscriber.channels[channelIndex].verified = true;

           console.log(JSON.stringify(channelIndex) + "<--channelIndex")
           console.log(JSON.stringify(subscriber) + "<--subscriber")

              const updateResponse = yield call(
          axios.patch,
          `${configBaseUrl}/subscription/v1/subscribers/${subscriber.id}`,
          subscriber,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );


        console.log(JSON.stringify(updateResponse) + "<--updatteREpsonse")

        // done updating subscriber //

        yield put(
          SuccessNotification({
            message: `Verification for ${email} is successful .`,
          })
        );
      } else {
        yield put(ErrorNotification({ message: 'The code is wrong' }));
        yield put(CheckCodeFailure());
      }
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
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
  yield takeEvery(CHECK_CODE, checkCode);
}
