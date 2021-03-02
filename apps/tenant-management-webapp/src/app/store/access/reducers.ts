import {
  AccessState,
  ActionTypes,
  GET_ACCESS_ACTION,
  FETCH_ACCESSINFO_SUCCESS_ACTION,
} from './types';

const initState: AccessState = {
  users: [],
  roles: [],
};

export default function accessReducer(
  state = initState,
  action: ActionTypes
): AccessState {
  switch (action.type) {
    case GET_ACCESS_ACTION:
      return {
        ...initState,
      };
    case FETCH_ACCESSINFO_SUCCESS_ACTION:
      return {
        ...initState,
        users: action.payload.users,
        roles: action.payload.roles,
      };
    default:
      return state;
  }
}
