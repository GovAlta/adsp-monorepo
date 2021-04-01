import { ActionTypes } from './actions';
import { ApiStatusState } from './models';

const INITIAL_STATE: ApiStatusState = { uptime: undefined, status: 'fetching' };

export default (state: ApiStatusState = INITIAL_STATE, action: ActionTypes): ApiStatusState => {
  switch (action.type) {
    case 'api-status/uptime/fetch_success':
      return {
        ...state,
        ...action.payload,
      };
    case 'api-status/uptime/fetch_failure':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
