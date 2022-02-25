import { put, select } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { FetchAccessSuccessAction } from './actions';
import { KeycloakApi } from './api';
import { Role } from './models';
import { UpdateIndicator } from '@store/session/actions';

// eslint-disable-next-line
export function* fetchAccess() {
  const currentState: RootState = yield select();

  const baseUrl = currentState.config.keycloakApi.url;
  const token = currentState.session.credentials.token;
  const realm = currentState.session.realm;

  const keycloakApi = new KeycloakApi(baseUrl, realm, token);

  try {
    const userCount = yield keycloakApi.getUserCount();
    const activeUserCount = yield keycloakApi.getUserCount(true);
    const roles = yield keycloakApi.getRoles();

    // add userId[] attribute to roles

    yield put(
      UpdateIndicator({
        show: true,
        message: 'Loading...',
      })
    );
    const rolesWithUsers = yield (async () => {
      const userRoles = roles.map(async (role: Role) => {
        const usersWithRole = await keycloakApi.getUsersByRole(role.name);
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
      payload: { userCount, activeUserCount, roles: rolesWithUsers },
    };

    yield put(action);
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
    yield put(ErrorNotification({ message: e.message }));
  }
}
