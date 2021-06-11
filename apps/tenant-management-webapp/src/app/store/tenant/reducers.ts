import { ActionType } from './actions';
import { TENANT_INIT, Tenant } from './models';

export default (state = TENANT_INIT, action: ActionType): Tenant => {
  switch (action.type) {
    case 'FETCH_TENANT_SUCCESS':
      return { ...state, ...action.payload };

    case 'UPDATE_TENANT_ADMIN_INFO':
      return { ...state, ...action.payload };

    case 'CREATE_TENANT_SUCCESS':
      return {
        ...state,
        isTenantCreated: true,
        realm: action.payload,
      };

    case 'SELECT_TENANT':
      return {
        ...state,
        isTenantCreated: true,
        realm: action.payload,
      };

    default:
      return state;
  }
};
