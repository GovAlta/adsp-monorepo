import { ActionType } from './actions';
import { TENANT_INIT } from './models';

export default (state = TENANT_INIT, action: ActionType) => {
  switch (action.type) {
    case 'FETCH_TENANT_SUCCESS':
      return { ...state, tenant: { ...action.payload } };

    default:
      return state;
  }
};
