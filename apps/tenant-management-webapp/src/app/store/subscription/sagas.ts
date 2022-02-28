import { put, select, call, takeEvery, takeLatest, all } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import { validate as validateUuid } from 'uuid';
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
  GET_SUBSCRIPTIONS,
  UnsubscribeAction,
  GetSubscriptionAction,
  GetSubscriptionSuccess,
  EmailExists,
  FindSubscribersAction,
  FindSubscribersSuccess,
  GetSubscriptionsAction,
  UpdateSubscriberAction,
  GetSubscriptionsSuccess,
  UpdateSubscriberSuccess,
  FIND_SUBSCRIBERS,
  UPDATE_SUBSCRIBER,
  GET_TYPE_SUBSCRIPTION,
  GetTypeSubscriptionActions,
  GetTypeSubscriptionSuccess,
  GET_SUBSCRIBER_SUBSCRIPTIONS,
  GetSubscriberSubscriptionsSuccess,
  GetSubscriberSubscriptionsAction,
  ResolveSubscriberUserAction,
  ResolveSubscriberUserSuccess,
  FindSubscribersSuccessAction,
  ResolveSubscriberUser,
  FIND_SUBSCRIBERS_SUCCESS,
  RESOLVE_SUBSCRIBER_USER,
  DeleteSubscriberAction,
  DELETE_SUBSCRIBER,
} from './actions';
import { Subscription, Subscriber, SubscriptionWrapper } from './models';
import { RootState } from '../index';
import axios from 'axios';
import { Api } from './api';
import { KeycloakApi } from '@store/access/api';
import { UpdateIndicator } from '@store/session/actions';

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
          typeId: response.data.typeId,
        };

        yield put(GetSubscriptionSuccess(subData));
      } else {
        yield put(GetSubscriptionSuccess(result));
      }
    } catch (e) {
      yield put(ErrorNotification({ message: `Subscriptions (getSubscription): ${e.message}` }));
    }
  }
}

export function* getAllSubscriptions(action: GetSubscriptionsAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const hasNotificationAdminRole = yield select((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:notification-service']?.roles?.includes('subscription-admin')
  );

  const criteria = action.payload;

  if (configBaseUrl && token) {
    try {
      const typeResponse = yield call(axios.get, `${configBaseUrl}/subscription/v1/types`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let params = {};
      if (criteria.email || criteria.name) {
        params = { topValue: 10000 };
      }

      const typeList = [...new Set(typeResponse.data.map((type) => type.id))].filter(Boolean);

      const results = yield all(
        typeList.map((id) => {
          const response = call(axios.get, `${configBaseUrl}/subscription/v1/types/${id}/subscriptions`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
          });

          return response;
        })
      );

      let subscriptions = results.map((result) => result.data.results);
      const idList = typeResponse.data.map((result) => result.id);

      subscriptions = subscriptions.map((element, index) => {
        element.type = idList[index];
        return element;
      });

      let subscriptionWrapper: SubscriptionWrapper[] = subscriptions.flat();

      if (criteria.name) {
        subscriptionWrapper = subscriptionWrapper.filter(
          (sub) =>
            sub.subscriber.addressAs && sub.subscriber.addressAs.toLowerCase().includes(criteria.name.toLowerCase())
        );
      }

      if (criteria.email) {
        subscriptionWrapper = subscriptionWrapper.filter((sub) => {
          const emailIndex = sub.subscriber.channels?.findIndex((channel) => channel.channel === 'email');
          return sub.subscriber.channels[emailIndex].address.toLowerCase().includes(criteria.email.toLowerCase());
        });
      }

      yield put(GetSubscriptionsSuccess(subscriptionWrapper, 10));
    } catch (e) {
      yield put(
        ErrorNotification({
          message: `Subscriptions (getAllSubscriptions): ${e.message}`,
          disabled: hasNotificationAdminRole !== true,
        })
      );
    }
  }
}

export function* getTypeSubscriptions(action: GetTypeSubscriptionActions): SagaIterator {
  const { criteria, type } = action.payload;
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const hasNextList = yield select((state: RootState) => state.subscription.subscriptionsHasNext);
  const typeIndex = hasNextList.findIndex((item) => item.id === type);
  const top = hasNextList[typeIndex]?.top || 10;
  const topParam = criteria?.next ? 10 + top + 1 : top + 1;

  if (configBaseUrl && token) {
    try {
      const response = yield call(
        axios.get,
        `${configBaseUrl}/subscription/v1/types/${type}/subscriptions/?name=${criteria.name}&email=${
          criteria.email
        }&topValue=${topParam}&after=${topParam - 10}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const subscriptions: SubscriptionWrapper[] = response.data.results;

      yield put(GetTypeSubscriptionSuccess(subscriptions, (topParam as number) - 1, type));
    } catch (e) {
      yield put(ErrorNotification({ message: `Subscriptions (getTypeSubscriptions): ${e.message}` }));
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
      yield put(ErrorNotification({ message: `Subscriptions (getSubscriber): ${e.message}` }));
    }
  }
}

export function* updateSubscriber(action: UpdateSubscriberAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const subscriber = action.payload.subscriber;

  if (configBaseUrl && token) {
    try {
      const api = new Api(configBaseUrl, token);

      const response = yield call([api, api.update], subscriber);

      const result = response;
      yield put(UpdateSubscriberSuccess(result));
    } catch (e) {
      const emailIndex = subscriber.channels?.findIndex((channel) => channel.channel === 'email');
      if (e.message.includes('already exists')) {
        yield put(EmailExists(subscriber.channels[emailIndex].address));
      } else {
        yield put(ErrorNotification({ message: `Subscriptions (updateSubscriber): ${e.message}` }));
      }
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
      yield put(ErrorNotification({ message: `Subscriptions (createSubscriber): ${e.message}` }));
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
      yield put(ErrorNotification({ message: `Subscriptions (addTypeSubscription): ${e.message}` }));
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

      yield put(UnsubscribeSuccess(subscriber, type));
    } catch (e) {
      yield put(ErrorNotification({ message: `Subscriptions (unsubscribe): ${e.message}` }));
    }
  }
}

export function* findSubscribers(action: FindSubscribersAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const hasNotificationAdminRole = yield select((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:notification-service']?.roles?.includes('subscription-admin')
  );
  const findSubscriberPath = 'subscription/v1/subscribers';
  const criteria = action.payload;
  const params: Record<string, string | number> = { top: 10 };

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

  if (criteria.next) {
    params.after = criteria.next;
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
    } catch (e) {
      yield put(
        ErrorNotification({
          message: `Subscriptions (findSubscribers): ${e.message}`,
          disabled: hasNotificationAdminRole !== true,
        })
      );
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* resolveSubscriberUsers(action: FindSubscribersSuccessAction): SagaIterator {
  for (const subscriber of action.payload.subscribers) {
    if (subscriber.userId && validateUuid(subscriber.userId)) {
      yield put(ResolveSubscriberUser(subscriber.id, subscriber.userId));
    }
  }
}

export function* resolveSubscriberUser(action: ResolveSubscriberUserAction): SagaIterator {
  try {
    const currentState: RootState = yield select();

    const baseUrl = currentState.config.keycloakApi.url;
    const token = currentState.session.credentials.token;
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

export function* getSubscriberSubscriptions(action: GetSubscriberSubscriptionsAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const subscriber = action.payload.subscriber;
  const findSubscriberPath = `subscription/v1/subscribers/${subscriber.id}/subscriptions`;

  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, `${configBaseUrl}/${findSubscriberPath}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subscriptions: SubscriptionWrapper[] = response.data.results;
      yield put(GetSubscriberSubscriptionsSuccess(subscriptions, subscriber));
    } catch (e) {
      yield put(ErrorNotification({ message: `Subscriptions (getSubscriberSubscriptions): ${e.message}` }));
    }
  }
}

export function* deleteSubscriber(action: DeleteSubscriberAction): SagaIterator {
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const subscriberId = action.payload.subscriberId;
  const deleteSubscriberPath = `subscription/v1/subscribers/${subscriberId}`;

  try {
    yield call(axios.delete, `${configBaseUrl}/${deleteSubscriberPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    yield put(ErrorNotification({ message: `Subscriptions (getSubscriberSubscriptions): ${e.message}` }));
  }
}

export function* watchSubscriptionSagas(): Generator {
  yield takeEvery(CREATE_SUBSCRIBER, createSubscriber);
  yield takeEvery(SUBSCRIBE_SUBSCRIBER, addTypeSubscription);
  yield takeEvery(GET_SUBSCRIBER, getSubscriber);
  yield takeEvery(UNSUBSCRIBE, unsubscribe);
  yield takeEvery(GET_SUBSCRIPTION, getSubscription);
  yield takeEvery(GET_SUBSCRIPTIONS, getAllSubscriptions);
  yield takeEvery(UPDATE_SUBSCRIBER, updateSubscriber);
  yield takeEvery(GET_TYPE_SUBSCRIPTION, getTypeSubscriptions);
  yield takeEvery(GET_SUBSCRIBER_SUBSCRIPTIONS, getSubscriberSubscriptions);
  yield takeEvery(DELETE_SUBSCRIBER, deleteSubscriber);
  yield takeLatest(FIND_SUBSCRIBERS, findSubscribers);
  yield takeEvery(FIND_SUBSCRIBERS_SUCCESS, resolveSubscriberUsers);
  yield takeEvery(RESOLVE_SUBSCRIBER_USER, resolveSubscriberUser);
}
