import { put, select, call, takeEvery } from 'redux-saga/effects';
import { RootState } from '../index';
import { ErrorNotification } from '../notifications/actions';
import { FetchRealmRolesSuccess, FETCH_REALM_ROLES } from './actions';

import { KeycloakApi } from '../access/api';
import { CredentialRefresh, UpdateIndicator, SetSessionExpired } from '../session/actions';

import { getOrCreateKeycloakAuth, KeycloakAuth } from '../../components/keycloak';
import { SagaIterator } from '@redux-saga/core';
import { Credentials, Session } from '../session/models';

export function* initializeKeycloakAuth(realm?: string): SagaIterator {
  const keycloakConfig = yield select((state: RootState) => state.config.serviceUrls?.keycloakApi);
  realm = realm || (yield select((state: RootState) => state.tenant.realm));
  return yield call(getOrCreateKeycloakAuth, keycloakConfig, realm);
}

export function* getAccessToken(isForce = false): SagaIterator {
  try {
    // Check if credentials still present or if logout has occurred.
    yield put(SetSessionExpired(true));
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
  } catch (e) {}
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

export function* watchTenantSagas(): SagaIterator {
  yield takeEvery(FETCH_REALM_ROLES, fetchRealmRoles);
}
