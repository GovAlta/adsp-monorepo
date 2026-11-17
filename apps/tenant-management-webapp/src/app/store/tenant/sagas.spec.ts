import { expectSaga } from 'redux-saga-test-plan';
import { KeycloakApi } from '@store/access/api';
import { ERROR_NOTIFICATION } from '@store/notifications/actions';
import { FetchRealmRolesFailed, FetchRealmRolesSuccess } from './actions';
import { fetchRealmRoles, getAccessToken } from './sagas';

const state = {
  config: { keycloakApi: { url: 'https://keycloak.example/auth/admin/realms' } },
  session: { realm: 'tenant-realm' },
  tenant: { realmRoles: null },
};

const provideToken = {
  call(effect, next) {
    if (effect.fn === getAccessToken) {
      return 'token';
    }
    return next();
  },
};

describe('fetchRealmRoles', () => {
  afterEach(() => jest.restoreAllMocks());

  it('stores the realm roles when the request succeeds', async () => {
    // Arrange
    const roles = [{ id: '1', name: 'admin' }];
    jest.spyOn(KeycloakApi.prototype, 'getRoles').mockResolvedValue(roles);

    // Act / Assert
    await expectSaga(fetchRealmRoles)
      .withState(state)
      .provide(provideToken)
      .put(FetchRealmRolesSuccess(roles))
      .not.put(FetchRealmRolesFailed())
      .run();
  });

  it('marks realm roles as failed and notifies when the request fails', async () => {
    // Arrange
    jest.spyOn(KeycloakApi.prototype, 'getRoles').mockRejectedValue(new Error('Request failed with status code 403'));

    // Act
    const { effects } = await expectSaga(fetchRealmRoles)
      .withState(state)
      .provide(provideToken)
      .put(FetchRealmRolesFailed())
      .run();

    // Assert
    const putTypes = effects.put.map((effect) => effect.payload.action.type);
    expect(putTypes).toContain(ERROR_NOTIFICATION);
  });

  it('does not fetch again once roles are loaded', async () => {
    // Arrange
    const getRoles = jest.spyOn(KeycloakApi.prototype, 'getRoles');

    // Act
    await expectSaga(fetchRealmRoles)
      .withState({ ...state, tenant: { realmRoles: [{ id: '1', name: 'admin' }] } })
      .provide(provideToken)
      .run();

    // Assert
    expect(getRoles).not.toHaveBeenCalled();
  });
});
