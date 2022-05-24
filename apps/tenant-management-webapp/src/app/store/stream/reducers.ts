import { InitialStreams, StreamStatus } from './models';
import {
  ActionTypes,
  DELETE_EVENT_STREAM_SUCCESS_ACTION,
  FETCH_EVENT_STREAMS_SUCCESS,
  UPDATE_EVENT_STREAM_SUCCESS_ACTION,
} from './actions';

export default function statusReducer(state: StreamStatus = InitialStreams, action: ActionTypes): StreamStatus {
  switch (action.type) {
    case FETCH_EVENT_STREAMS_SUCCESS: {
      return {
        ...state,
        tenant: action.payload.tenantStreams,
        core: action.payload.coreStreams,
      };
    }
    case UPDATE_EVENT_STREAM_SUCCESS_ACTION: {
      return {
        ...state,
        tenant: action.payload.tenantStreams,
      };
    }
    case DELETE_EVENT_STREAM_SUCCESS_ACTION: {
      return {
        ...state,
        tenant: action.payload.tenantStreams,
      };
    }
    default:
      return state;
  }
}
