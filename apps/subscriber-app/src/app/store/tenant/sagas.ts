import { put, select, call, takeEvery } from 'redux-saga/effects';
import { RootState, store } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  KeycloakCheckSSOAction,
  TenantLoginAction,
  KeycloakCheckSSOWithLogOutAction,
  FetchTenantAction,
  FetchTenantSucceededService,
  FETCH_TENANT,
  UpdateLoginSuccess
} from './actions';

import { SessionLoginSuccess } from '@store/session/actions';
import { createKeycloakAuth, keycloakAuth } from '@lib/keycloak';
import { convertToSession } from '@lib/session';
import { SagaIterator } from '@redux-saga/core';
import { isUUID, getRealm } from './realmUtils';

import axios from 'axios';

export function* fetchTenant(action: FetchTenantAction): SagaIterator {
  const { tenantId } = action.payload.tenant;

  try {
    const tenant = (yield call(axios.get, `/api/tenant/v1/tenant/${tenantId}`)).data;

    yield put(FetchTenantSucceededService(tenant));
  } catch (err) {
    yield put(ErrorNotification({ error: err}));
  }
}

export function* keycloakCheckSSO(action: KeycloakCheckSSOAction): SagaIterator {
  try {
    const state: RootState = yield select();
    const realm = action.payload;

    const loginRedirectUrl = `${window.location.origin}/subscriptions`;
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth({ ...keycloakConfig, realm }, loginRedirectUrl);
    keycloakAuth.checkSSO(
      (keycloak) => {
        const session = convertToSession(keycloak);
        Promise.all([
          store.dispatch(SessionLoginSuccess(session)),
          // store.dispatch(IsTenantAdmin(session.userInfo.email)),
        ]);
      },
      () => {
        console.error('Failed to check the SSO');
      }
    );
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to check keycloak SSO', error: err }));
  }
}

export function* keycloakCheckSSOWithLogout(action: KeycloakCheckSSOWithLogOutAction): SagaIterator {
  try {
    const state: RootState = yield select();
    const realm = action.payload;
    const loginRedirectUrl = `${window.location.origin}/subscriptions`;
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth({ ...keycloakConfig, realm }, loginRedirectUrl);
    console.debug('Checkout keycloak SSO');
    keycloakAuth.checkSSO(
      (keycloak) => {
        const session = convertToSession(keycloak);
        Promise.all([store.dispatch(SessionLoginSuccess(session))]);
      },
      () => {
        const url = `/${realm}/login`;
        window.location.replace(url);
      }
    );
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to check keycloak SSO', error: err }));
  }
}

export function* tenantLogin(action: TenantLoginAction): SagaIterator {
  try {
    const state: RootState = yield select();
    const loginRedirectUrl = `${window.location.origin}/subscriptions`;
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth({ ...keycloakConfig }, loginRedirectUrl);

   const tenantApi = yield select((state: RootState) => state.config.tenantApi);
    const realm = isUUID(action.payload) ? action.payload : yield call(getRealm, action.payload, tenantApi?.host);

    if (!realm) {
      yield put(UpdateLoginSuccess(false));
      return;
    }

    keycloakAuth.loginByIdP('core', realm);
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to check keycloak SSO', error: err }));
  }
}

export function* keycloakRefreshToken(realm?: string): SagaIterator {
  try {
    if (keycloakAuth) {
      keycloakAuth.refreshToken(
        (keycloak) => {
          const session = convertToSession(keycloak);
          Promise.all([store.dispatch(SessionLoginSuccess(session))]);
        },
        () => {
          const url = `/${realm}/login`;
          window.location.replace(url);
        }
      );
    } else {
      console.warn(`Try to fresh keycloak token. But, keycloak instance is empty.`);
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to tenant login', error: err }));
  }
}

export function* tenantLogout(): SagaIterator {
  try {
    if (keycloakAuth) {
      Promise.resolve(keycloakAuth.logout());
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to tenant out', error: err }));
  }
}

export function* watchTenantSagas(): Generator {
  yield takeEvery(FETCH_TENANT, fetchTenant);
}
