import { InitialStreams, StreamStatus } from './models';
import {
  ActionTypes,
  DELETE_EVENT_STREAM_SUCCESS_ACTION,
  FETCH_EVENT_STREAMS_SUCCESS,
  START_SOCKET_STREAM_SUCCESS,
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
    case START_SOCKET_STREAM_SUCCESS:
      return {
        ...state,
        socket: action.socket,
      };
    default:
      return state;
  }
}
