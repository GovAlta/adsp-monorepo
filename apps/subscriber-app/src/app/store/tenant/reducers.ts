import { ActionType } from './actions';
import { TENANT_INIT, Tenant } from './models';
import { FETCH_TENANT_SUCCEEDED, UPDATE_LOGIN_SUCCESS } from './actions';

export default (state = TENANT_INIT, action: ActionType): Tenant => {
  switch (action.type) {
    case FETCH_TENANT_SUCCEEDED: {
      const tenant = action.payload.tenant;

      return tenant;
    }
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
