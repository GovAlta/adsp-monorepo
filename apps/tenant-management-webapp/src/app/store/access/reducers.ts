import {
  ActionTypes,
  FETCH_SERVICE_ROLES_SUCCESS,
  FETCH_KEYCLOAK_SERVICE_ROLES_SUCCESS,
  CREATE_KEYCLOAK_ROLE_SUCCESS,
} from './actions';
import { ACCESS_INIT, AccessState, SERVICE_ROLES_INIT, ServiceRoleState } from './models';

export default function accessReducer(state: AccessState = ACCESS_INIT, action: ActionTypes): AccessState {
  switch (action.type) {
    case 'tenant/access/FETCH_ACCESS_SUCCESS':
      return {
        ...state,
        metrics: {
          users: action.payload.userCount,
          activeUsers: action.payload.activeUserCount,
        },
        roles: action.payload.roles.reduce((rs, r) => ({ ...rs, [r.id]: r }), state.roles),
      };
    case 'tenant/access/RESET':
      return { ...ACCESS_INIT };
    default:
      return state;
  }
}

export function serviceRolesReduce(
  state: ServiceRoleState = SERVICE_ROLES_INIT,
  action: ActionTypes
): ServiceRoleState {
  switch (action.type) {
    case FETCH_SERVICE_ROLES_SUCCESS: {
      return {
        ...state,
        ...action.payload,
      };
    }
    case FETCH_KEYCLOAK_SERVICE_ROLES_SUCCESS: {
      return {
        ...state,
        ...action.payload,
      };
    }
    case CREATE_KEYCLOAK_ROLE_SUCCESS: {
      const { clientId, id, role } = action.payload;
      if (!(clientId in state.keycloakIdMap)) {
        state.keycloakIdMap[clientId] = id;
      }

      if (!(clientId in state.keycloak)) {
        state.keycloak[clientId] = {
          roles: [],
        };
      }

      const mergedRoleConfig = { ...state.tenant, ...state.core };
      state.keycloak[clientId].roles.push(
        mergedRoleConfig[clientId].roles.find((r) => {
          return r.role === role;
        })
      );
      return { ...state };
    }
    // eslint-disable-next-line
    default:
      return state;
  }
}
