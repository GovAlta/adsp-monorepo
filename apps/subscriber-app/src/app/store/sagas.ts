import { all, takeEvery } from 'redux-saga/effects';

// Sagas
import { fetchAccess } from './access/sagas';
import { fetchConfig } from './config/sagas';
import {
  fetchTenant,
  createTenant,
  isTenantAdmin,
  tenantAdminLogin,
  tenantCreationInitLogin,
  keycloakCheckSSO,
  tenantLogin,
  keycloakCheckSSOWithLogout,
  keycloakRefreshToken,
  tenantLogout,
  fetchRealmRoles,
} from './tenant/sagas';
import { watchSubscriptionSagas } from './subscription/sagas';

// Actions
import { FETCH_ACCESS_ACTION } from './access/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';
import {
  FETCH_TENANT,
  CREATE_TENANT,
  CHECK_IS_TENANT_ADMIN,
  TENANT_ADMIN_LOGIN,
  TENANT_CREATION_LOGIN_INIT,
  KEYCLOAK_CHECK_SSO,
  TENANT_LOGIN,
  KEYCLOAK_CHECK_SSO_WITH_LOGOUT,
  KEYCLOAK_REFRESH_TOKEN,
  TENANT_LOGOUT,
  FETCH_REALM_ROLES,
} from './tenant/actions';

// eslint-disable-next-line  @typescript-eslint/explicit-module-boundary-types
export function* watchSagas() {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeEvery(FETCH_ACCESS_ACTION, fetchAccess);

  // tenant and keycloak
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);

  //tenant config
  yield takeEvery(KEYCLOAK_CHECK_SSO, keycloakCheckSSO);
  yield takeEvery(TENANT_LOGIN, tenantLogin);
  yield takeEvery(KEYCLOAK_CHECK_SSO_WITH_LOGOUT, keycloakCheckSSOWithLogout);
  yield takeEvery(KEYCLOAK_REFRESH_TOKEN, keycloakRefreshToken);
  yield takeEvery(TENANT_LOGOUT, tenantLogout);

  //tenant config
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeEvery(FETCH_TENANT, fetchTenant);
  yield takeEvery(FETCH_REALM_ROLES, fetchRealmRoles);
  yield takeEvery(TENANT_ADMIN_LOGIN, tenantAdminLogin);
  yield takeEvery(TENANT_CREATION_LOGIN_INIT, tenantCreationInitLogin);
  yield all([
    // subscription
    watchSubscriptionSagas(),
  ]);
}
