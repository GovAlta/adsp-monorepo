import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import { throwError } from 'redux-saga-test-plan/providers';
import { getAccessToken } from '@store/tenant/sagas';
import { fetchKeycloakGroupsFailed, fetchKeycloakGroupsSuccess } from './actions';
import { KeycloakApi } from './api';
import { fetchKeycloakGroups } from './sagas';

describe('fetchKeycloakGroups', () => {
  const state = { config: { keycloakApi: { url: 'https://keycloak/auth' } }, session: { realm: 'autotest' } };
  const groups = [{ id: 'g1', name: 'medical', path: '/medical' }];

  it('stores the groups of the realm', () =>
    expectSaga(fetchKeycloakGroups)
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [matchers.call.fn(KeycloakApi.prototype.getGroups), groups],
      ])
      .put(fetchKeycloakGroupsSuccess(groups))
      .run());

  it('marks the groups as unavailable when Keycloak refuses the request', () =>
    expectSaga(fetchKeycloakGroups)
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [matchers.call.fn(KeycloakApi.prototype.getGroups), throwError(new Error('403'))],
      ])
      .put(fetchKeycloakGroupsFailed())
      .run());
});
