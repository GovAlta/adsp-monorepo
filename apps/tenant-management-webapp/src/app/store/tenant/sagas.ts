import { put, select, call } from 'redux-saga/effects';
import { RootState, store } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  CheckIsTenantAdminAction,
  CheckHasAdminRoleAction,
  CreateTenantAction,
  CreateTenantSuccess,
  FetchTenantAction,
  FetchTenantSuccess,
  UpdateTenantAdminInfo,
  UpdateHasAdminRole,
  IsTenantAdmin,
  KeycloakCheckSSOAction,
  TenantLoginAction,
  KeycloakCheckSSOWithLogOutAction,
  FetchRealmRolesSuccess,
  HasAdminRole,
} from './actions';

import { SessionLoginSuccess } from '@store/session/actions';
import { TenantApi } from './api';
import { TENANT_INIT } from './models';
import { createKeycloakAuth, keycloakAuth, LOGIN_TYPES } from '@lib/keycloak';
import { convertToSession } from '@lib/session';
import { SagaIterator } from '@redux-saga/core';

export function* fetchTenant(action: FetchTenantAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const realm = action.payload;

  try {
    const tenant = yield call([api, api.fetchTenantByRealm], realm);
    yield put(FetchTenantSuccess(tenant));
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to fetch tenant' }));
  }
}

export function* hasAdminRole(action: CheckHasAdminRoleAction): SagaIterator {
  const state: RootState = yield select();
  const token = state?.session?.credentials?.token;
  const api = new TenantApi(state.config.tenantApi, token);

  try {
    const response = yield call([api, api.hasAdminRole]);
    yield put(UpdateHasAdminRole(response));
  } catch (e) {
    yield put(UpdateHasAdminRole(false));
    yield put(ErrorNotification({ message: 'failed to check tenant admin' }));
  }
}

export function* isTenantAdmin(action: CheckIsTenantAdminAction): SagaIterator {
  const state: RootState = yield select();
  const token = state?.session?.credentials?.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const email = action.payload;

  try {
    const response = yield call([api, api.fetchTenantByEmail], email);
    yield put(UpdateTenantAdminInfo(true, response.name, response.realm));
  } catch (e) {
    yield put(UpdateTenantAdminInfo(false, TENANT_INIT.name, TENANT_INIT.realm));

    yield put(ErrorNotification({ message: 'failed to check tenant admin' }));
  }
}

export function* createTenant(action: CreateTenantAction): SagaIterator {
  const state: RootState = yield select();
  const token = state?.session?.credentials?.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const name = action.payload;

  try {
    const result = yield call([api, api.createTenant], name);
    yield put(CreateTenantSuccess(result.realm));
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to create new tenant: ${e.message}` }));
  }
}

export function* tenantAdminLogin(): SagaIterator {
  try {
    const state: RootState = yield select();
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth(keycloakConfig);
    keycloakAuth.loginByCore(LOGIN_TYPES.tenantAdmin);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to login as admin: ${e.message}` }));
  }
}

export function* tenantCreationInitLogin(): SagaIterator {
  try {
    const state: RootState = yield select();
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth(keycloakConfig);
    keycloakAuth.loginByCore(LOGIN_TYPES.tenantCreationInit);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to first step of tenant creation: ${e.message}` }));
  }
}

export function* keycloakCheckSSO(action: KeycloakCheckSSOAction): SagaIterator {
  try {
    const state: RootState = yield select();
    const realm = action.payload;

    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth({ ...keycloakConfig, realm });
    console.log('Run keycloak check sso');
    keycloakAuth.checkSSO(
      (keycloak) => {
        const session = convertToSession(keycloak);
        Promise.all([
          store.dispatch(SessionLoginSuccess(session)),
          store.dispatch(IsTenantAdmin(session.userInfo.email)),
        ]);
      },
      () => {
        console.error('Failed to check the SSO');
      }
    );
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to check keycloak SSO: ${e.message}` }));
  }
}

export function* keycloakCheckSSOWithLogout(action: KeycloakCheckSSOWithLogOutAction): SagaIterator {
  try {
    const state: RootState = yield select();
    const realm = action.payload;
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth({ ...keycloakConfig, realm });
    console.debug('Checkout keycloak SSO');
    keycloakAuth.checkSSO(
      (keycloak) => {
        const session = convertToSession(keycloak);
        Promise.all([store.dispatch(SessionLoginSuccess(session)), store.dispatch(HasAdminRole())]);
      },
      () => {
        window.location.replace('/');
      }
    );
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to check keycloak SSO: ${e.message}` }));
  }
}

export function* tenantLogin(action: TenantLoginAction): SagaIterator {
  try {
    const state: RootState = yield select();
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth(keycloakConfig);

    keycloakAuth.loginByIdP('core', action.payload);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant login: ${e.message}` }));
  }
}

export function* keycloakRefreshToken(): SagaIterator {
  try {
    if (keycloakAuth) {
      keycloakAuth.refreshToken(
        (keycloak) => {
          const session = convertToSession(keycloak);
          Promise.all([store.dispatch(SessionLoginSuccess(session)), store.dispatch(HasAdminRole())]);
        },
        () => {
          window.location.replace('/');
        }
      );
    } else {
      console.warn(`Try to fresh keycloak token. But, keycloak instance is empty.`);
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant login: ${e.message}` }));
  }
}

export function* tenantLogout(): SagaIterator {
  try {
    if (keycloakAuth) {
      Promise.resolve(keycloakAuth.logout());
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant out: ${e.message}` }));
  }
}

export function* fetchRealmRoles(): SagaIterator {
  try {
    const state: RootState = yield select();
    const token = state?.session?.credentials?.token;
    const api = new TenantApi(state.config.tenantApi, token);
    const roles = yield call([api, api.fetchRealmRoles]);
    yield put(FetchRealmRolesSuccess(roles));
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to fetch realm roles: ${e.message}` }));
  }
}
