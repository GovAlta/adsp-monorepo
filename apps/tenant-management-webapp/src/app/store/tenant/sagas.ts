import { put, select } from 'redux-saga/effects';
import { RootState, store } from '@store/index';
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
} from './actions';

import { SessionLoginSuccess } from '@store/session/actions';
import { TenantApi } from './api';
import { TENANT_INIT } from './models';
import { createKeycloakAuth, keycloakAuth, LOGIN_TYPES } from '@lib/keycloak';
import { convertToSession } from '@lib/session';

export function* fetchTenant(action: FetchTenantAction) {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const email = action.payload;

  try {
    const response = yield api.fetchTenantByEmail(email);
    yield put(FetchTenantSuccess(response.tenant));
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to fetch tenant' }));
  }
}

export function* isTenantAdmin(action: CheckIsTenantAdminAction) {
  const state: RootState = yield select();
  const token = state?.session?.credentials?.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const email = action.payload;

  try {
    const response = yield api.fetchTenantByEmail(email);
    yield put(UpdateTenantAdminInfo(true, response.name, response.realm));
  } catch (e) {
    yield put(UpdateTenantAdminInfo(false, TENANT_INIT.name, TENANT_INIT.realm));

    yield put(ErrorNotification({ message: 'failed to check tenant admin' }));
  }
}

export function* createTenant(action: CreateTenantAction) {
  const state: RootState = yield select();
  const token = state?.session?.credentials?.token;
  const api = new TenantApi(state.config.tenantApi, token);
  const name = action.payload;

  try {
    const result = yield api.createTenant(name);
    yield put(CreateTenantSuccess(result.realm));
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to create new tenant: ${e.message}` }));
  }
}

export function* tenantAdminLogin() {
  try {
    const state: RootState = yield select();
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth(keycloakConfig);
    keycloakAuth.loginByCore(LOGIN_TYPES.tenantAdmin);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to login as admin: ${e.message}` }));
  }
}

export function* tenantCreationInitLogin() {
  try {
    const state: RootState = yield select();
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth(keycloakConfig);
    keycloakAuth.loginByCore(LOGIN_TYPES.tenantCreationInit);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to first step of tenant creation: ${e.message}` }));
  }
}

export function* keycloakCheckSSO(action: KeycloakCheckSSOAction) {
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

export function* keycloakCheckSSOWithLogout(action: KeycloakCheckSSOWithLogOutAction) {
  try {
    const state: RootState = yield select();
    const realm = action.payload;
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth({ ...keycloakConfig, realm });
    console.debug('Checkout keycloak SSO');
    keycloakAuth.checkSSO(
      (keycloak) => {
        const session = convertToSession(keycloak);
        Promise.all([store.dispatch(SessionLoginSuccess(session))]);
      },
      () => {
        window.location.replace('/');
      }
    );
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to check keycloak SSO: ${e.message}` }));
  }
}

export function* tenantLogin(action: TenantLoginAction) {
  try {
    const state: RootState = yield select();
    const keycloakConfig = state.config.keycloakApi;
    createKeycloakAuth(keycloakConfig);

    keycloakAuth.loginByIdP('core', action.payload);
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant login: ${e.message}` }));
  }
}

export function* keycloakRefreshToken() {
  try {
    if (keycloakAuth) {
      keycloakAuth.refreshToken();
    } else {
      console.warn(`Try to fresh keycloak token. But, keycloak instance is empty.`);
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant login: ${e.message}` }));
  }
}

export function* tenantLogout() {
  try {
    if (keycloakAuth) {
      Promise.resolve(keycloakAuth.logout());
    }
  } catch (e) {
    yield put(ErrorNotification({ message: `Failed to tenant out: ${e.message}` }));
  }
}
