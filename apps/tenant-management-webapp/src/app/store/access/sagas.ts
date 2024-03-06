import { put, select, call, all } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  FetchAccessSuccessAction,
  fetchServiceRolesSuccess,
  FetchServiceRolesAction,
  FetchKeycloakServiceRolesAction,
  fetchKeycloakServiceRolesSuccess,
  CreateKeycloakRoleAction,
  createKeycloakRoleSuccess,
  FETCH_KEYCLOAK_SERVICE_ROLES,
} from './actions';
import { KeycloakApi } from './api';
import { Role } from './models';
import { UpdateIndicator, UpdateLoadingState, UpdateResourceAccess } from '@store/session/actions';
import { ActionState } from '@store/session/models';
import { SagaIterator } from '@redux-saga/core';
import axios from 'axios';
import {
  KeycloakRoleToServiceRole,
  createKeycloakClientTemplate,
  TENANT_SERVICE_CLIENT_URN,
  TENANT_ADMIN_ROLE,
  ConfigServiceRole,
  Events,
} from './models';
import { getAccessToken } from '@store/tenant/sagas';

// eslint-disable-next-line
export function* fetchAccess() {
  const currentState: RootState = yield select();

  const baseUrl = currentState.config.keycloakApi.url;
  const token = yield call(getAccessToken);
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

    yield put(
      ErrorNotification({
        error: e,
      })
    );
  }
}

export function* fetchServiceRoles(_action: FetchServiceRolesAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
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
      yield put(
        ErrorNotification({
          error: err,
        })
      );
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* fetchKeycloakServiceRoles(action: FetchKeycloakServiceRolesAction): SagaIterator {
  const serviceRoles = yield select((state: RootState) => state.serviceRoles?.keycloak);
  if (serviceRoles && !action?.forceToUpdate) return;
  const token: string = yield call(getAccessToken);
  const keycloakIdMap = {};
  const keycloakBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.keycloakUrl);
  const realm: string = yield select((state: RootState) => state.session.realm);

  const defaultRealmClients = ['broker', 'realm-management', 'account'];
  const details = {};
  details[FETCH_KEYCLOAK_SERVICE_ROLES] = ActionState.inProcess;

  yield put(
    UpdateIndicator({
      details,
    })
  );

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
          return !defaultRealmClients.includes(c.clientId);
        })
        .forEach((c) => {
          keycloakRoleNames.push(c.clientId);
          keycloakRoleIds.push(c.id);
          keycloakIdMap[c.clientId] = c.id;
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const rolePromises = keycloakRoleIds.map((id, index) => {
        const url = `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients/${id}/roles`;
        return call(axios.get, url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });

      const roleResponses = yield all(rolePromises);

      roleResponses.forEach((response, index) => {
        keycloakRoles[keycloakRoleNames[index]] = {
          roles: KeycloakRoleToServiceRole(response.data),
        };
      });

      yield put(
        fetchKeycloakServiceRolesSuccess({
          keycloak: keycloakRoles,
          keycloakIdMap,
        })
      );

      details[FETCH_KEYCLOAK_SERVICE_ROLES] = ActionState.completed;

      yield put(
        UpdateIndicator({
          details,
        })
      );
    } catch (err) {
      details[FETCH_KEYCLOAK_SERVICE_ROLES] = ActionState.error;
      yield put(
        UpdateIndicator({
          details,
        })
      );

      yield put(
        ErrorNotification({
          error: err,
        })
      );
    }
  }
}

export function* createKeycloakClient(action: CreateKeycloakRoleAction): SagaIterator {
  const token: string = yield call(getAccessToken);
  const keycloakBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.keycloakUrl);
  const realm: string = yield select((state: RootState) => state.session.realm);

  try {
    const tenantRoleConfig = yield select((state: RootState) => state.serviceRoles.tenant);
    const coreRoleConfig = yield select((state: RootState) => state.serviceRoles.core);
    const keycloakConfig = yield select((state: RootState) => state.serviceRoles.keycloak);
    const keycloakIdMap = yield select((state: RootState) => state.serviceRoles.keycloakIdMap);
    const mergedConfig = { ...tenantRoleConfig, ...coreRoleConfig };
    const { clientId, roleName } = action.payload;

    yield put(
      UpdateLoadingState({
        name: Events.update,
        state: 'start',
        data: {
          clientId: clientId,
          role: roleName,
        },
      })
    );

    const headers = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const addCompositeRolePayload = [];

    // eslint-disable-next-line
    const [_clientId, clientConfig] = Object.entries(mergedConfig).find(([_clientId, config]) => {
      return _clientId === clientId;
    });

    const isClientExisted = clientId in keycloakConfig;
    // The id of the client in keycloak table;
    let clientIdInDB = isClientExisted ? keycloakIdMap[clientId] : null;

    // Add client first if it does not exist
    if (token && keycloakBaseUrl && realm && clientConfig && !isClientExisted) {
      const client = createKeycloakClientTemplate(clientId);
      const url = `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients`;
      yield call(axios.post, url, client, headers);
      const { data } = yield call(axios.get, url, headers);
      clientIdInDB = data.find((client) => {
        return client.clientId === clientId;
      }).id;
    }

    // Get the tenant service composite role id
    const url = `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients/${keycloakIdMap[TENANT_SERVICE_CLIENT_URN]}/roles`;
    const { data } = yield call(axios.get, url, headers);
    const tenantAdminRoleId = data.find((role) => {
      return role.name === TENANT_ADMIN_ROLE;
    }).id;

    if (roleName) {
      const url = `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients/${clientIdInDB}/roles`;
      const roleConfig = (clientConfig as ConfigServiceRole).roles.find((role) => {
        return role.role === roleName;
      });

      // Create the new role

      try {
        yield call(
          axios.post,
          url,
          {
            name: roleConfig.role,
            description: roleConfig.description,
          },
          headers
        );
      } catch (e) {
        // 409 indicates the role is created, which is expected in some cases.
        if (e.status !== 409) {
          console.error(e.response);
        }
      }

      // Start to add the role to the tenant-admin composite role

      if (roleConfig.inTenantAdmin) {
        const { data } = yield call(axios.get, url, headers);
        const newRoleId = data.find((role) => {
          return role.name === roleName;
        }).id;

        addCompositeRolePayload.push({
          clientRole: true,
          composite: false,
          containerId: clientIdInDB,
          description: roleConfig.description,
          id: newRoleId,
          name: roleName,
        });
      }

      // Add the role added to tenant-admin role
      yield call(
        axios.post,
        `${keycloakBaseUrl}/auth/admin/realms/${realm}/roles-by-id/${tenantAdminRoleId}/composites`,
        addCompositeRolePayload,
        headers
      );
      yield put(UpdateResourceAccess(clientId, roleName));
    }

    yield put(createKeycloakRoleSuccess(clientId, clientIdInDB, roleName));
    yield put(
      UpdateLoadingState({
        name: Events.update,
        state: 'completed',
        data: null,
      })
    );
  } catch (err) {
    yield put(
      ErrorNotification({
        error: err,
      })
    );

    yield put(
      UpdateLoadingState({
        name: Events.update,
        state: 'error',
        data: null,
      })
    );
  }
}
