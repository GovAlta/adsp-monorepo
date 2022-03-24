import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  CheckIsTenantAdminAction,
  CreateTenantAction,
  CreateTenantSuccess,
  FetchTenantAction,
  FetchTenantSuccess,
  UpdateTenantAdminInfo,
  IsTenantAdmin,
  KeycloakCheckSSOAction,
  TenantLoginAction,
  KeycloakCheckSSOWithLogOutAction,
  FetchRealmRolesSuccess,
} from './actions';

import { CredentialRefresh, SessionLoginSuccess } from '@store/session/actions';
import { TenantApi } from './api';
import { TENANT_INIT } from './models';
import { createKeycloakAuth, KeycloakAuth, LOGIN_TYPES } from '@lib/keycloak';
import { SagaIterator } from '@redux-saga/core';
import { KeycloakConfig } from 'keycloak-js';
import { Session } from '@store/session/models';

export function* initializeKeycloakAuth(config?: KeycloakConfig): SagaIterator {
  const keycloakConfig = config || (yield select((state: RootState) => state.config.keycloakApi));
  return yield call(createKeycloakAuth, keycloakConfig);
}

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
  } catch (err) {
    yield put(ErrorNotification({ message: `${err.message}` }));
  }
}

export function* tenantAdminLogin(): SagaIterator {
  try {
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth);
    yield call([keycloakAuth, keycloakAuth.loginByCore], LOGIN_TYPES.tenantAdmin);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to login as admin: ${e.message}` }));
  }
}

export function* tenantCreationInitLogin(): SagaIterator {
  try {
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth);
    yield call([keycloakAuth, keycloakAuth.loginByCore], LOGIN_TYPES.tenantCreationInit);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to first step of tenant creation: ${e.message}` }));
  }
}

export function* keycloakCheckSSO(action: KeycloakCheckSSOAction): SagaIterator {
  try {
    const config = yield select((state: RootState) => state.config.keycloakApi);
    const realm = action.payload;
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, { ...config, realm });

    console.log('Run keycloak check sso');

    const session = yield call([keycloakAuth, keycloakAuth.checkSSO]);
    if (session) {
      yield put(SessionLoginSuccess(session));
      yield put(IsTenantAdmin(session.userInfo.email));
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to check keycloak SSO: ${e.message}` }));
  }
}

export function* keycloakCheckSSOWithLogout(action: KeycloakCheckSSOWithLogOutAction): SagaIterator {
  try {
    const config = yield select((state: RootState) => state.config.keycloakApi);
    const realm = action.payload;
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, { ...config, realm });

    console.debug('Checkout keycloak SSO');

    const session = yield call([keycloakAuth, keycloakAuth.checkSSO]);
    if (!session) {
      window.location.replace('/');
    } else {
      yield put(SessionLoginSuccess(session));
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to check keycloak SSO: ${e.message}` }));
  }
}

export function* tenantLogin(action: TenantLoginAction): SagaIterator {
  try {
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth);

    yield call([keycloakAuth, keycloakAuth.loginByIdP], 'core', action.payload);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant login: ${e.message}` }));
  }
}

export function* keycloakRefreshToken(): SagaIterator {
  try {
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth);
    if (keycloakAuth) {
      const session: Session = yield call([keycloakAuth, keycloakAuth.refreshToken]);
      if (session) {
        const { credentials } = session;
        yield put(CredentialRefresh(credentials));
      }
    } else {
      console.warn(`Try to fresh keycloak token. But, keycloak instance is empty.`);
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant login: ${e.message}` }));
  }
}

export function* tenantLogout(): SagaIterator {
  try {
    const config = yield select((state: RootState) => state.config.keycloakApi);
    const realm = yield select((state: RootState) => state.tenant.realm);
    if (realm) {
      const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, { ...config, realm });
      yield call([keycloakAuth, keycloakAuth.logout]);
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
