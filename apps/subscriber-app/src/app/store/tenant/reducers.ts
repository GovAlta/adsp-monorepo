import { ActionType } from './actions';
import { TENANT_INIT, Tenant } from './models';
import { FETCH_TENANT_SUCCEEDED } from './actions';

export default (state = TENANT_INIT, action: ActionType): Tenant => {
  switch (action.type) {
    case FETCH_TENANT_SUCCEEDED: {
      const tenant = action.payload.tenant;

      return tenant;
    }
    default:
      return state;
  }
};
