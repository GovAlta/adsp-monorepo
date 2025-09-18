import { put, select, call, takeEvery, takeLatest } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification, SuccessNotification } from '@store/notifications/actions';
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
  UpdateAccessTokenAction,
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
  TenantAdminLoginAction,
  TenantCreationLoginInitAction,
  UPDATE_ACCESS_TOKEN,
  UpdateLoginSuccess,
  FETCH_USER_ID_BY_EMAIL,
  FetchUserIdByEmailAction,
  DELETE_USER_IDP,
  DeleteUserIdpAction,
} from './actions';

import { KeycloakApi } from '@store/access/api';
import {
  CredentialRefresh,
  SessionLoginSuccess,
  UpdateIndicator,
  SetSessionExpired,
  UpdateLoadingState,
} from '@store/session/actions';
import {
  TenantApi,
  callFetchUserIdInCoreByEmail,
  callFetchUserIdInTenantByEmail,
  callDeleteUserIdPFromCore,
  callCheckUserIdpInCore,
} from './api';
import { TENANT_INIT } from './models';
import { getOrCreateKeycloakAuth, KeycloakAuth, LOGIN_TYPES } from '@lib/keycloak';
import { SagaIterator } from '@redux-saga/core';
import { Credentials, Session } from '@store/session/models';
import { getIdpHint } from '@lib/keycloak';
import { isUUID, getRealm } from './realmUtils';

export function* initializeKeycloakAuth(realm?: string): SagaIterator {
  const keycloakConfig = yield select((state: RootState) => state.config.keycloakApi);
  realm = realm || (yield select((state: RootState) => state.tenant.realm));
  return yield call(getOrCreateKeycloakAuth, keycloakConfig, realm);
}

export function* fetchTenant(action: FetchTenantAction): SagaIterator {
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const api = new TenantApi(state.config.tenantApi, token);
  const realm = action.payload;

  try {
    const tenant = yield call([api, api.fetchTenantByRealm], realm);
    yield put(FetchTenantSuccess(tenant));
  } catch (e) {
    yield put(
      ErrorNotification({
        message: 'failed to fetch tenant',
        error: e,
      })
    );
  }
}

export function* isTenantAdmin(action: CheckIsTenantAdminAction): SagaIterator {
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
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
  const token = yield call(getAccessToken);
  const api = new TenantApi(state.config.tenantApi, token);
  const name = action.payload;

  try {
    const result = yield call([api, api.createTenant], name);
    yield put(CreateTenantSuccess(result.realm));
  } catch (err) {
    if (err.message.includes('Invalid value')) {
      yield put(
        ErrorNotification({
          message: 'Value not valid for Tenant name: Names cannot contain special characters (e.g. ! & %).',
        })
      );
    } else {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* tenantAdminLogin(action: TenantAdminLoginAction): SagaIterator {
  try {
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, 'core');
    yield call([keycloakAuth, keycloakAuth.loginByCore], LOGIN_TYPES.tenantAdmin, action.payload);
  } catch (e) {
    yield put(ErrorNotification({ message: 'Failed to login as admin', error: e }));
  }
}

export function* tenantCreationInitLogin(action: TenantCreationLoginInitAction): SagaIterator {
  try {
    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, 'core');
    yield call([keycloakAuth, keycloakAuth.loginByCore], LOGIN_TYPES.tenantCreationInit, action.payload);
  } catch (e) {
    yield put(ErrorNotification({ message: 'Failed to first step of tenant creation', error: e }));
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
    yield put(ErrorNotification({ message: 'Failed to check keycloak SSO', error: e }));
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
    yield put(ErrorNotification({ message: 'Failed to check keycloak SSO', error: e }));
  }
}

export function* tenantLogin(action: TenantLoginAction): SagaIterator {
  try {
    const tenantApi = yield select((state: RootState) => state.config.tenantApi);
    const realm = isUUID(action.payload) ? action.payload : yield call(getRealm, action.payload, tenantApi?.host);

    if (!realm) {
      yield put(UpdateLoginSuccess(false));
      return;
    }

    const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, realm);

    let idp = 'core';
    const idpHint = getIdpHint();

    if (idpHint !== null) {
      idp = idpHint;
    }

    yield call([keycloakAuth, keycloakAuth.loginByTenant], idp);
  } catch (e) {
    yield put(ErrorNotification({ message: 'Failed to login tenant', error: e }));
  }
}

export function* getAccessToken(isForce = false): SagaIterator {
  const realmInSession = localStorage.getItem('realm');

  try {
    // Check if credentials still present or if logout has occurred.
    const credentials: Credentials = yield select((state: RootState) => state.session.credentials);
    const isExpired = yield select((state: RootState) => state.session.isExpired);

    // Check if token is within 1 min of expiry.
    if (credentials.tokenExp - Date.now() / 1000 < 60 || isForce) {
      const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth);
      const session: Session = yield call([keycloakAuth, keycloakAuth.refreshToken]);
      if (isExpired === true) {
        yield put(SetSessionExpired(false));
      }
      if (session) {
        const { credentials } = session;
        yield put(CredentialRefresh(credentials));

        return credentials.token;
      }
    } else {
      return credentials.token;
    }
  } catch (e) {
    // Failure to get the access token results in a logout.
    if (realmInSession) {
      yield put(SetSessionExpired(true));
    } else {
      yield put(TenantLogout());
    }
  }
}

export function* tenantLogout(): SagaIterator {
  try {
    const realm = (yield select((state: RootState) => state.tenant.realm)) || 'core';
    if (realm) {
      const keycloakAuth: KeycloakAuth = yield call(initializeKeycloakAuth, realm);
      yield call([keycloakAuth, keycloakAuth.logout]);
    }
  } catch (e) {
    yield put(ErrorNotification({ message: 'Failed to log tenant out', error: e }));
  }
}

export function* fetchRealmRoles(): SagaIterator {
  try {
    const { config, session, tenant }: RootState = yield select();

    if (tenant?.realmRoles) return;

    yield put(
      UpdateIndicator({
        show: true,
        message: 'Loading...',
      })
    );

    const baseUrl = config.keycloakApi.url;
    const realm = session.realm;

    const token = yield call(getAccessToken);
    const api = new KeycloakApi(baseUrl, realm, token);
    const roles = yield call([api, api.getRoles]);

    yield put(FetchRealmRolesSuccess(roles));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (e) {
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
    yield put(ErrorNotification({ message: 'Failed to fetch realm roles', error: e }));
  }
}

export function* updateAccessToken(_action: UpdateAccessTokenAction): SagaIterator {
  yield call(getAccessToken, true);
}

export function* fetchUserIdByEmail(action: FetchUserIdByEmailAction): SagaIterator {
  const { session, config }: RootState = yield select();

  const { email } = action;
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const coreUserIdUrl = `${state.config?.tenantApi?.host}/api/tenant/v1/user/id`;
  const tenantUserIdUrl = `${config.keycloakApi.url}/admin/realms/${session.realm}/users`;
  const checkUserIdPInCoreUrl = `${state.config?.tenantApi?.host}/api/tenant/v1/user/default-idp`;

  try {
    yield put(
      UpdateLoadingState({
        name: FETCH_USER_ID_BY_EMAIL,
        state: 'start',
      })
    );

    const coreRealmUserId = yield call(callFetchUserIdInCoreByEmail, coreUserIdUrl, token, email);
    const tenantRealmUserId = yield call(callFetchUserIdInTenantByEmail, tenantUserIdUrl, token, email);
    if (coreRealmUserId && tenantRealmUserId) {
      const hasDefaultIdpInCore = yield call(callCheckUserIdpInCore, checkUserIdPInCoreUrl, token, coreRealmUserId);
      yield put(
        UpdateLoadingState({
          name: FETCH_USER_ID_BY_EMAIL,
          state: 'completed',
          id: coreRealmUserId,
          data: {
            hasDefaultIdpInCore,
          },
        })
      );
    } else {
      yield put(
        UpdateLoadingState({
          name: FETCH_USER_ID_BY_EMAIL,
          state: 'completed',
          data: {},
        })
      );
    }
  } catch (err) {
    yield put(
      UpdateLoadingState({
        name: FETCH_USER_ID_BY_EMAIL,
        state: 'error',
        data: {},
      })
    );
  }
}

export function* deleteUserIdpFromCore(action: DeleteUserIdpAction): SagaIterator {
  const { userId, realm } = action;

  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const url = `${state.config?.tenantApi?.host}/api/tenant/v1/user/idp`;
  try {
    yield put(
      UpdateLoadingState({
        name: DELETE_USER_IDP,
        state: 'start',
      })
    );

    yield call(callDeleteUserIdPFromCore, url, token, userId, realm);
    yield put(
      UpdateLoadingState({
        name: DELETE_USER_IDP,
        state: 'completed',
      })
    );
    yield put(
      SuccessNotification({
        message: 'ADSP default user IdP in the core has been deleted successfully.',
      })
    );
  } catch (err) {
    yield put(
      ErrorNotification({
        message: 'Failed to delete user IdP in core',
        error: err,
      })
    );
    yield put(
      UpdateLoadingState({
        name: DELETE_USER_IDP,
        state: 'error',
        data: err.message,
      })
    );
  }
}

export function* watchTenantSagas(): SagaIterator {
  // tenant and keycloak
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);
  yield takeEvery(KEYCLOAK_CHECK_SSO, keycloakCheckSSO);
  yield takeEvery(TENANT_LOGIN, tenantLogin);
  yield takeEvery(KEYCLOAK_CHECK_SSO_WITH_LOGOUT, keycloakCheckSSOWithLogout);
  yield takeEvery(TENANT_LOGOUT, tenantLogout);
  yield takeEvery(UPDATE_ACCESS_TOKEN, updateAccessToken);
  yield takeEvery(FETCH_USER_ID_BY_EMAIL, fetchUserIdByEmail);
  yield takeEvery(DELETE_USER_IDP, deleteUserIdpFromCore);

  //tenant config
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeLatest(FETCH_TENANT, fetchTenant);
  yield takeEvery(FETCH_REALM_ROLES, fetchRealmRoles);
  yield takeEvery(TENANT_ADMIN_LOGIN, tenantAdminLogin);
  yield takeEvery(TENANT_CREATION_LOGIN_INIT, tenantCreationInitLogin);
}
