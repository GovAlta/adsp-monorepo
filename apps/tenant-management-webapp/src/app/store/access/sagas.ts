import { put, select, call, all } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { FetchAccessSuccessAction, fetchServiceRolesSuccess, FetchServiceRolesAction } from './actions';
import { KeycloakApi } from './api';
import { Role, ServiceRoles, ServiceRoleConfig } from './models';
import { UpdateIndicator } from '@store/session/actions';
import { SagaIterator } from '@redux-saga/core';
import axios from 'axios';

// eslint-disable-next-line
export function* fetchAccess() {
  const currentState: RootState = yield select();

  const baseUrl = currentState.config.keycloakApi.url;
  const token = currentState.session.credentials.token;
  const realm = currentState.session.realm;

  const keycloakApi = new KeycloakApi(baseUrl, realm, token);

  try {
    yield put(
      UpdateIndicator({
        show: true,
        message: 'Loading...',
      })
    );
    const userCount = yield keycloakApi.getUserCount();
    const activeUserCount = yield keycloakApi.getUserCount(true);
    const roles = (yield keycloakApi.getRoles()).filter((role) => role.name !== `default-roles-${realm}`);

    // add userId[] attribute to roles

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

const selectServiceRoles = (config?: ServiceRoleConfig): ServiceRoles => {
  const roles: ServiceRoles = [];
  if (config) {
    Object.entries(config).forEach(([k, c]) => {
      if (c?.roles) {
        c.roles.forEach((role) => {
          roles.push(role);
        });
      }
    });

    return roles;
  }

  return roles;
};

export function* fetchServiceRoles(action: FetchServiceRolesAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  if (configBaseUrl && token) {
    try {
      const { tenantResponse, coreResponse } = yield all({
        tenantResponse: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/tenant-service`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        coreResponse: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/tenant-service?core`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      });

      yield put(
        fetchServiceRolesSuccess({
          tenant: selectServiceRoles(tenantResponse?.data?.latest?.configuration),
          core: selectServiceRoles(coreResponse?.data?.latest?.configuration),
        })
      );
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}
