import { InitialStreams, StreamStatus } from './models';
import { ActionTypes, FETCH_CORE_STREAMS_SUCCESS, FETCH_TENANT_STREAMS_SUCCESS } from './actions';

export default function statusReducer(state: StreamStatus = InitialStreams, action: ActionTypes): StreamStatus {
  switch (action.type) {
    case FETCH_CORE_STREAMS_SUCCESS: {
      return {
        ...state,
        core: action.payload,
      };
    }
    case FETCH_TENANT_STREAMS_SUCCESS: {
      return {
        ...state,
        tenant: action.payload,
      };
    }

    default:
      return state;
  }
}
