import { ActionTypes } from './actions';
import { ACCESS_INIT, AccessState } from './models';

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
