import {
  ActionType,
  FETCH_REALM_ROLES_SUCCESS,
} from './actions';
import { TENANT_INIT, Tenant } from './models';

export default (state = TENANT_INIT, action: ActionType): Tenant => {
  switch (action.type) {
    case FETCH_REALM_ROLES_SUCCESS:
      return {
        ...state,
        realmRoles: action.payload,
      };
    default:
      return state;
  }
};
