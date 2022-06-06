import { put, select, call, all } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  FetchAccessSuccessAction,
  fetchServiceRolesSuccess,
  FetchServiceRolesAction,
  FetchKeycloakServiceRolesAction,
  fetchKeycloakServiceRolesSuccess,
} from './actions';
import { KeycloakApi } from './api';
import { Role } from './models';
import { UpdateIndicator } from '@store/session/actions';
import { SagaIterator } from '@redux-saga/core';
import axios from 'axios';
import { KeycloakRoleToServiceRole } from './models';

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
          tenant: tenantResponse?.data?.latest?.configuration,
          core: coreResponse?.data?.latest?.configuration,
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

export function* fetchKeycloakServiceRoles(action: FetchKeycloakServiceRolesAction): SagaIterator {
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const keycloakBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.keycloakUrl);
  const realm: string = yield select((state: RootState) => state.session.realm);

  const tenantRoleNames = Object.keys(yield select((state: RootState) => state.serviceRoles.tenant));
  const coreRoleNames = Object.keys(yield select((state: RootState) => state.serviceRoles.core));
  const configRoleNames = [...tenantRoleNames, ...coreRoleNames];

  if (token && keycloakBaseUrl && realm) {
    try {
      const url = `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients`;

      const { data } = yield call(axios.get, url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const keycloakRoles = {};
      const keycloakRoleIds: string[] = [];
      const keycloakRoleNames: string[] = [];

      data
        .filter((c) => {
          return configRoleNames.includes(c.clientId);
        })
        .forEach((c) => {
          keycloakRoleNames.push(c.clientId);
          keycloakRoleIds.push(c.id);
        });

      for (const [index, id] of keycloakRoleIds.entries()) {
        const url = `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients/${id}/roles`;

        const { data } = yield call(axios.get, url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        keycloakRoles[keycloakRoleNames[index]] = {
          roles: KeycloakRoleToServiceRole(data),
        };
      }

      yield put(
        fetchKeycloakServiceRolesSuccess({
          keycloak: keycloakRoles,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}
