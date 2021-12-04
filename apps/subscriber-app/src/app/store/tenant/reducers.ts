import { ActionType } from './actions';
import { TENANT_INIT, Tenant } from './models';

export default (state = TENANT_INIT, action: ActionType): Tenant => {
  switch (action.type) {
    default:
      return state;
  }
};
