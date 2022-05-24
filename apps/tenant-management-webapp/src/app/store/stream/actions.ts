import { Stream, Streams } from './models';

export const FETCH_EVENT_STREAMS_SUCCESS = 'fetch/events/streams/success';
export const FETCH_EVENT_STREAMS = 'fetch/events/streams';

export const UPDATE_EVENT_STREAM_ACTION = 'update/events/streams/UPDATE_EVENT_STREAM_ACTION';
export const UPDATE_EVENT_STREAM_SUCCESS_ACTION = 'update/events/stream/UPDATE_EVENT_STREAM_SUCCESS_ACTION';

export const DELETE_EVENT_STREAM_ACTION = 'configuration/DELETE_EVENT_STREAM_ACTION';
export const DELETE_EVENT_STREAM_SUCCESS_ACTION = 'configuration/DELETE_EVENT_STREAM_ACTION_SUCCESS';

export type ActionTypes =
  | FetchEventStreamsAction
  | FetchEventStreamsSuccessAction
  | UpdateEventStreamAction
  | UpdateEventStreamSuccessAction
  | DeleteEventStreamAction
  | DeleteEventStreamSuccessAction;

// delete streams actions
export interface DeleteEventStreamAction {
  type: typeof DELETE_EVENT_STREAM_ACTION;
  eventStreamId: string;
}

export interface DeleteEventStreamSuccessAction {
  type: typeof DELETE_EVENT_STREAM_SUCCESS_ACTION;
  payload: {
    tenantStreams: Record<string, Stream>;
  };
}

export const deleteEventStream = (eventStreamId: string): DeleteEventStreamAction => ({
  type: DELETE_EVENT_STREAM_ACTION,
  eventStreamId,
});

export const deleteEventStreamSuccess = (eventStreams: Record<string, Stream>): DeleteEventStreamSuccessAction => ({
  type: DELETE_EVENT_STREAM_SUCCESS_ACTION,
  payload: {
    tenantStreams: eventStreams,
  },
});

// update stream actions
export interface UpdateEventStreamAction {
  type: typeof UPDATE_EVENT_STREAM_ACTION;
  stream: Stream;
}
export interface UpdateEventStreamSuccessAction {
  type: typeof UPDATE_EVENT_STREAM_SUCCESS_ACTION;
  payload: {
    tenantStreams: Record<string, Stream>;
  };
}

export const updateEventStream = (stream: Stream): UpdateEventStreamAction => ({
  type: UPDATE_EVENT_STREAM_ACTION,
  stream,
});

export const updateEventStreamSuccess = (stream: Record<string, Stream>): UpdateEventStreamSuccessAction => ({
  type: UPDATE_EVENT_STREAM_SUCCESS_ACTION,
  payload: {
    tenantStreams: stream,
  },
});

// fetch streams actions
export interface FetchEventStreamsAction {
  type: typeof FETCH_EVENT_STREAMS;
}

export interface FetchEventStreamsSuccessAction {
  type: typeof FETCH_EVENT_STREAMS_SUCCESS;
  payload: {
    tenantStreams: Streams;
    coreStreams: Streams;
  };
}

export const fetchEventStreams = (): FetchEventStreamsAction => ({
  type: FETCH_EVENT_STREAMS,
});

export const fetchEventStreamsSuccess = ({
  tenantStreams,
  coreStreams,
}: Record<string, Streams>): FetchEventStreamsSuccessAction => ({
  type: FETCH_EVENT_STREAMS_SUCCESS,
  payload: {
    tenantStreams,
    coreStreams,
  },
});
