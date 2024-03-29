import { put, select, call, takeEvery } from 'redux-saga/effects';
import { SagaIterator } from '@redux-saga/core';
import { validate as validateUuid } from 'uuid';
import {
  GET_MY_SUBSCRIBER,
  SubscribeSuccess,
  GetMySubscriberSuccess,
  SubscribeAction,
  UnsubscribeSuccess,
  UNSUBSCRIBE,
  UnsubscribeAction,
  FindSubscribersAction,
  FindSubscribersSuccess,
  UpdateSubscriberAction,
  UpdateSubscriberSuccess,
  FIND_SUBSCRIBERS,
  UPDATE_SUBSCRIBER,
  GET_TYPE_SUBSCRIPTIONS,
  GetTypeSubscriptionsActions,
  GetTypeSubscriptionSuccess,
  ResolveSubscriberUserAction,
  ResolveSubscriberUserSuccess,
  FindSubscribersSuccessAction,
  ResolveSubscriberUser,
  FIND_SUBSCRIBERS_SUCCESS,
  RESOLVE_SUBSCRIBER_USER,
  DeleteSubscriberAction,
  DELETE_SUBSCRIBER,
  GetAllTypeSubscriptionsAction,
  GetTypeSubscriptions as getTypeSubscriptionsAction,
  GET_ALL_TYPE_SUBSCRIPTIONS,
  SUBSCRIBE,
  DeleteSubscriberSuccess,
  DELETE_SUBSCRIPTION,
  DeleteSubscriptionSuccess,
} from './actions';
import { Subscriber, Events } from './models';
import { RootState } from '../index';
import axios from 'axios';
import { Api } from './api';
import { KeycloakApi } from '@store/access/api';
import { UpdateIndicator, UpdateLoadingState } from '@store/session/actions';
import { fetchCoreNotificationTypes, fetchNotificationTypes } from '@store/notification/sagas';
import { NotificationItem } from '@store/notification/models';
import { ErrorNotification, SuccessNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';

export function* getMySubscriber(): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.get,
        `${configBaseUrl}/subscription/v1/subscribers/my-subscriber?includeSubscriptions=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = response.data;

      yield put(GetMySubscriberSuccess(result));
    } catch (err) {
      // Don't show error for 404 since that is expected when user has never subscribed before.
      if (!axios.isAxiosError(err) || err.response.status !== 404) {
        yield put(ErrorNotification({ error: err }));
      }
    }
  }
}

function* subscribe(action: SubscribeAction): SagaIterator {
  const type = action.payload.notificationInfo.data.type;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);
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
        ...result,
      };

      yield put(SubscribeSuccess({ data: { type: type, data: subData, email: email } }));

      // TODO: This is always a subscription for the current user, so show the success feedback.
      yield put(
        SuccessNotification({
          message: `You are subscribed! You will receive notifications on ${email} for ${action.payload.notificationInfo.data.type}.`,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function* unsubscribe(action: UnsubscribeAction): SagaIterator {
  const type = action.payload.subscriptionInfo.data.type;
  const id = action.payload.subscriptionInfo.data.data.id;
  const subscriber = action.payload.subscriptionInfo.data.data;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);
  const userId: string = yield select((state: RootState) => state.session.userInfo?.sub);

  if (configBaseUrl && token) {
    try {
      yield call(axios.delete, `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(UnsubscribeSuccess(subscriber, type));
      if (subscriber.userId === userId) {
        yield put(
          SuccessNotification({
            message: `You are unsubscribed! You will no longer receive notifications for ${type}.`,
          })
        );
      }
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

// deletes a subscription for a given subscriberId
function* deleteSubscription(action: UnsubscribeAction): SagaIterator {
  const type = action.payload.subscriptionInfo.data.type;
  const id = action.payload.subscriptionInfo.data.data.id;
  const subscriber = action.payload.subscriptionInfo.data.data;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      yield call(axios.delete, `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(DeleteSubscriptionSuccess(subscriber, type));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function* getAllTypeSubscriptions(action: GetAllTypeSubscriptionsAction): SagaIterator {
  let notificationTypes: Record<string, NotificationItem> = yield select((state: RootState) => ({
    ...state.notification.notificationTypes,
    ...state.notification.core,
  }));
  try {
    yield put(
      UpdateIndicator({
        show: true,
        message: 'Loading...',
      })
    );

    yield put(
      UpdateLoadingState({
        name: Events.search,
        state: 'start',
      })
    );

    yield call(fetchCoreNotificationTypes);
    yield call(fetchNotificationTypes);

    notificationTypes = yield select((state: RootState) => ({
      ...state.notification.core,
      ...state.notification.notificationTypes,
    }));

    for (const typeId of Object.keys(notificationTypes)) {
      yield put(getTypeSubscriptionsAction(typeId, action.payload, null));
    }
    yield put(
      UpdateIndicator({
        show: false,
      })
    );

    yield put(
      UpdateLoadingState({
        name: Events.search,
        state: 'completed',
      })
    );
  } catch (err) {
    yield put(
      UpdateIndicator({
        show: false,
      })
    );

    yield put(
      UpdateLoadingState({
        name: Events.search,
        state: 'error',
      })
    );
  }
}

function* getTypeSubscriptions(action: GetTypeSubscriptionsActions): SagaIterator {
  const { criteria, type, after } = action.payload;

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const subscriberCriteria =
        criteria.name || criteria.email || criteria.sms
          ? JSON.stringify({
              name: criteria.name || undefined,
              email: criteria.email || undefined,
              sms: criteria.sms || undefined,
            })
          : null;
      const response = yield call(
        axios.get,
        `${configBaseUrl}/subscription/v1/types/${type}/subscriptions?${
          subscriberCriteria ? `subscriberCriteria=${subscriberCriteria}` : ''
        }&top=10${after ? `&after=${after}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const subscriptions = response.data.results;

      yield put(GetTypeSubscriptionSuccess(type, subscriptions, after, response.data.page.next));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function* updateSubscriber(action: UpdateSubscriberAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);
  const subscriber = action.payload.subscriber;

  if (configBaseUrl && token) {
    try {
      const api = new Api(configBaseUrl, token);

      const response = yield call([api, api.update], subscriber);

      const result = response;
      yield put(UpdateSubscriberSuccess(result));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function* findSubscribers(action: FindSubscribersAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);

  const findSubscriberPath = 'subscription/v1/subscribers';
  const criteria = action.payload;
  const params: Record<string, string | number> = { top: 10 };

  if (action.payload.reset) {
    yield put(FindSubscribersSuccess(null, ''));
  }

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  if (criteria.email) {
    params.email = criteria.email;
  }

  if (criteria.name) {
    params.name = criteria.name;
  }

  if (criteria.sms) {
    params.sms = criteria.sms;
  }

  if (criteria.next) {
    if (action.payload.paginationReset) {
      params.after = null;
    } else {
      params.after = criteria.next;
    }
  }
  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, `${configBaseUrl}/${findSubscriberPath}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const subscribers = response.data.results;
      yield put(FindSubscribersSuccess(subscribers, response.data.page?.next, response.data.page?.after));
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

function* resolveSubscriberUsers(action: FindSubscribersSuccessAction): SagaIterator {
  if (action.payload.subscribers) {
    for (const subscriber of action.payload.subscribers) {
      if (subscriber.userId && validateUuid(subscriber.userId)) {
        yield put(ResolveSubscriberUser(subscriber.id, subscriber.userId));
      }
    }
  }
}

function* resolveSubscriberUser(action: ResolveSubscriberUserAction): SagaIterator {
  try {
    const currentState: RootState = yield select();

    const baseUrl = currentState.config.keycloakApi.url;
    const token = yield call(getAccessToken);
    const realm = currentState.session.realm;

    const keycloakApi = new KeycloakApi(baseUrl, realm, token);
    const user = yield call([keycloakApi, keycloakApi.getUser], action.payload.userId);
    if (user?.id) {
      yield put(
        ResolveSubscriberUserSuccess(
          action.payload.subscriberId,
          `${baseUrl}/admin/${realm}/console/#/realms/${realm}/users/${user.id}`
        )
      );
    }
  } catch (e) {
    // This is best effort, so ok if not resolved.
  }
}

function* deleteSubscriber(action: DeleteSubscriberAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield call(getAccessToken);
  const subscriberId = action.payload.subscriberId;
  const deleteSubscriberPath = `subscription/v1/subscribers/${subscriberId}`;

  try {
    yield call(axios.delete, `${configBaseUrl}/${deleteSubscriberPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    yield put(DeleteSubscriberSuccess(action.payload.subscriberId));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(GET_MY_SUBSCRIBER, getMySubscriber);
  yield takeEvery(SUBSCRIBE, subscribe);
  yield takeEvery(UNSUBSCRIBE, unsubscribe);
  yield takeEvery(DELETE_SUBSCRIPTION, deleteSubscription);
  yield takeEvery(GET_ALL_TYPE_SUBSCRIPTIONS, getAllTypeSubscriptions);
  yield takeEvery(GET_TYPE_SUBSCRIPTIONS, getTypeSubscriptions);
  yield takeEvery(FIND_SUBSCRIBERS, findSubscribers);
  yield takeEvery(FIND_SUBSCRIBERS_SUCCESS, resolveSubscriberUsers);
  yield takeEvery(RESOLVE_SUBSCRIBER_USER, resolveSubscriberUser);
  yield takeEvery(UPDATE_SUBSCRIBER, updateSubscriber);
  yield takeEvery(DELETE_SUBSCRIBER, deleteSubscriber);
}
