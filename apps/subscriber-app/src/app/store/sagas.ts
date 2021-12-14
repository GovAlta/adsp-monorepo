import { all, takeEvery } from 'redux-saga/effects';

// Sagas
import { fetchConfig } from './config/sagas';
import {
  keycloakCheckSSO,
  tenantLogin,
  keycloakCheckSSOWithLogout,
  keycloakRefreshToken,
  tenantLogout,
} from './tenant/sagas';
import { watchSubscriptionSagas } from './subscription/sagas';

// Actions
import { FETCH_CONFIG_ACTION } from './config/actions';
import {
  KEYCLOAK_CHECK_SSO,
  TENANT_LOGIN,
  KEYCLOAK_CHECK_SSO_WITH_LOGOUT,
  KEYCLOAK_REFRESH_TOKEN,
  TENANT_LOGOUT,
} from './tenant/actions';

// eslint-disable-next-line  @typescript-eslint/explicit-module-boundary-types
export function* watchSagas() {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);

  //tenant config
  yield takeEvery(KEYCLOAK_CHECK_SSO, keycloakCheckSSO);
  yield takeEvery(TENANT_LOGIN, tenantLogin);
  yield takeEvery(KEYCLOAK_CHECK_SSO_WITH_LOGOUT, keycloakCheckSSOWithLogout);
  yield takeEvery(KEYCLOAK_REFRESH_TOKEN, keycloakRefreshToken);
  yield takeEvery(TENANT_LOGOUT, tenantLogout);

  yield all([
    // subscription
    watchSubscriptionSagas(),
  ]);
}
