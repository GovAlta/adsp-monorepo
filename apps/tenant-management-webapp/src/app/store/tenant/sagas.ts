import { put, select, call, takeEvery, takeLatest, delay } from 'redux-saga/effects';
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
  CHECK_IS_TENANT_ADMIN,
  CREATE_TENANT,
  FETCH_REALM_ROLES,
  FETCH_TENANT,
  KEYCLOAK_CHECK_SSO,
  KEYCLOAK_CHECK_SSO_WITH_LOGOUT,
  TENANT_ADMIN_LOGIN,
  TENANT_CREATION_LOGIN_INIT,
  TENANT_LOGIN,
  TENANT_LOGOUT,
  TenantLogout,
} from './actions';

import {
  CredentialRefresh,
  CredentialRefreshAction,
  CREDENTIAL_REFRESH,
  SessionLoginSuccess,
  SessionLoginSuccessAction,
  SESSION_LOGIN_SUCCESS,
} from '@store/session/actions';
import { TenantApi } from './api';
import { TENANT_INIT } from './models';
import { createKeycloakAuth, KeycloakAuth, LOGIN_TYPES } from '@lib/keycloak';
import { SagaIterator } from '@redux-saga/core';
import { Session } from '@store/session/models';

export function* initializeKeycloakAuth(realm?: string): SagaIterator {
  const keycloakConfig = yield select((state: RootState) => state.config.keycloakApi);
  realm = realm || (yield select((state: RootState) => state.tenant.realm || 'core'));
  return yield call(createKeycloakAuth, { ...keycloakConfig, realm });
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
    const realm = action.payload;
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, realm);

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
    const realm = action.payload;
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, realm);

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

export function* keycloakRefreshToken(action: CredentialRefreshAction | SessionLoginSuccessAction): SagaIterator {
  try {
    let credentials = action.type === SESSION_LOGIN_SUCCESS ? action.payload.credentials : action.payload;
    const refreshDelay = Math.floor(credentials.tokenExp * 1000 - (Date.now() + 60000));
    yield delay(refreshDelay);

    // Check if credentials still present or if logout has occurred.
    credentials = yield select((state: RootState) => state.session.credentials);
    if (credentials) {
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
    }
  } catch (e) {
    // Refresh error means that the session has expired or idle timeout etc... so log out.
    yield put(TenantLogout());
  }
}

export function* tenantLogout(): SagaIterator {
  try {
    const realm = yield select((state: RootState) => state.tenant.realm);
    if (realm) {
      const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth);
      yield call([keycloakAuth, keycloakAuth.logout]);
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to log tenant out: ${e.message}` }));
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

export function* watchTenantSagas(): SagaIterator {
  // tenant and keycloak
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);
  yield takeEvery(KEYCLOAK_CHECK_SSO, keycloakCheckSSO);
  yield takeEvery(TENANT_LOGIN, tenantLogin);
  yield takeEvery(KEYCLOAK_CHECK_SSO_WITH_LOGOUT, keycloakCheckSSOWithLogout);
  yield takeEvery(TENANT_LOGOUT, tenantLogout);
  yield takeLatest([SESSION_LOGIN_SUCCESS, CREDENTIAL_REFRESH], keycloakRefreshToken);

  //tenant config
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeLatest(FETCH_TENANT, fetchTenant);
  yield takeEvery(FETCH_REALM_ROLES, fetchRealmRoles);
  yield takeEvery(TENANT_ADMIN_LOGIN, tenantAdminLogin);
  yield takeEvery(TENANT_CREATION_LOGIN_INIT, tenantCreationInitLogin);
}
