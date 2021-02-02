import {
  UPTIME_FETCH,
  UPTIME_FETCH_SUCCEEDED,
  UPTIME_FETCH_FAILED,
} from '../actions/types';

const INITIAL_STATE = { uptime: 0, status: '' };

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPTIME_FETCH:
      return { ...state, status: 'resetting' };
    case UPTIME_FETCH_SUCCEEDED:
      return { ...state, uptime: action.payload, status: 'loaded' };
    case UPTIME_FETCH_FAILED:
      return { ...state, uptime: 'Unknown', status: 'failed' };
    default:
      return state;
  }
};
