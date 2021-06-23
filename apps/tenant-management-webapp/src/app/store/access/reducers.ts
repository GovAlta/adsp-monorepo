import { ActionTypes } from './actions';
import { ACCESS_INIT, AccessState } from './models';

export default function accessReducer(state: AccessState = ACCESS_INIT, action: ActionTypes): AccessState {
  switch (action.type) {
    case 'tenant/access/FETCH_ACCESS_SUCCESS':
      return {
        ...state,
        users: action.payload.users,
        roles: action.payload.roles,
        loadingState: 'idle',
      };
    case 'tenant/access/FETCH_ACCESS':
      return {
        ...state,
        loadingState: 'loading',
      };
    default:
      return state;
  }
}
