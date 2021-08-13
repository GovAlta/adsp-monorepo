import { ActionType } from './actions';
import { TENANT_INIT, Tenant } from './models';

export default (state = TENANT_INIT, action: ActionType): Tenant => {
  switch (action.type) {
    case 'FETCH_TENANT_SUCCESS':
      console.log(JSON.stringify(action.payload) + '<tenantPayload');

      return { ...state, id: action.payload.id, name: action.payload.name, adminEmail: action.payload.adminEmail };

    case 'UPDATE_TENANT_ADMIN_INFO':
      return { ...state, ...action.payload };

    case 'UPDATE_HAS_ADMIN_ROLE':
      return { ...state, ...action.payload };

    case 'CREATE_TENANT_SUCCESS':
      return {
        ...state,
        isTenantCreated: true,
        realm: action.payload,
      };

    case 'UPDATE_TENANT_CREATED':
      return {
        ...state,
        isTenantCreated: false,
      };

    case 'SELECT_TENANT':
      return {
        ...state,
        realm: action.payload,
      };

    case 'FETCH_REALM_ROLES_SUCCESS':
      return {
        ...state,
        realmRoles: action.payload,
      };

    default:
      return state;
  }
};
