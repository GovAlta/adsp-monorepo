import {
  ActionType,
  CREATE_TENANT_SUCCESS,
  FETCH_REALM_ROLES_SUCCESS,
  FETCH_TENANT_SUCCESS,
  SELECT_TENANT,
  UPDATE_LOGIN_SUCCESS,
  UPDATE_TENANT_ADMIN_INFO,
  UPDATE_TENANT_CREATED,
} from './actions';
import { TENANT_INIT, Tenant } from './models';

export default (state = TENANT_INIT, action: ActionType): Tenant => {
  switch (action.type) {
    case FETCH_TENANT_SUCCESS:
      return {
        ...state,
        id: action.payload.id,
        name: action.payload.name,
        adminEmail: action.payload.adminEmail,
        realm: action.payload.realm,
      };

    case UPDATE_TENANT_ADMIN_INFO:
      if (action.payload.isTenantAdmin === false) {
        return { ...state, isTenantAdmin: false };
      }

      return { ...state, ...action.payload };

    case CREATE_TENANT_SUCCESS:
      return {
        ...state,
        isTenantCreated: true,
        realm: action.payload,
      };

    case UPDATE_TENANT_CREATED:
      return {
        ...state,
        isTenantCreated: false,
      };

    case SELECT_TENANT:
      return {
        ...state,
        realm: action.payload,
      };

    case FETCH_REALM_ROLES_SUCCESS:
      return {
        ...state,
        realmRoles: action.payload,
      };

    case UPDATE_LOGIN_SUCCESS: {
      return {
        ...state,
        loginSucceeded: action.payload,
      };
    }

    default:
      return state;
  }
};
