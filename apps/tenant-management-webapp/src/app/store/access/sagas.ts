import { put, select } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { FetchAccessSuccessAction } from './actions';
import { KeycloakApi } from './api';
import { Role, User } from './models';

export function* fetchAccess() {
  const currentState: RootState = yield select();

  const baseUrl = currentState.config.keycloakApi.url;
  const token = currentState.session.credentials.token;
  const realm = currentState.session.realm;

  const keycloakApi = new KeycloakApi(baseUrl, realm, token);

  try {
    const [ users, roles] = [
      yield keycloakApi.getUsers(),
      yield keycloakApi.getRoles(),
    ];

    // add userId[] attribute to roles
    const rolesWithUsers = yield (async () => {
      const userIds = users.map((user: User) => user.id);
      const userRoles = roles.map(async (role: Role) => {
        const usersWithRole = (await keycloakApi.getUsersByRole(role.name)).filter((user) =>
          userIds.includes(user.id)
        );
        return { roleId: role.id, users: usersWithRole.map((user) => user.id) };
      });

      return await Promise.all(userRoles).then((mapItems) => {
        const userRoleMap = {};
        mapItems.forEach((userRole) => (userRoleMap[userRole['roleId']] = userRole['users']));

        return roles.map((role: Role) => {
          return {
            ...role,
            userIds: userRoleMap[role.id] || [],
          };
        });
      });
    })();

    const action: FetchAccessSuccessAction = {
      type: 'tenant/access/FETCH_ACCESS_SUCCESS',
      payload: { users, roles: rolesWithUsers },
    };

    yield put(action);
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
