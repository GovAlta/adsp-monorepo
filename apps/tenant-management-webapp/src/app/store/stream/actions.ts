import { Streams } from './models';
export const FETCH_TENANT_STREAMS = 'fetch/streams/tenant';
export const FETCH_TENANT_STREAMS_SUCCESS = 'fetch/streams/tenant/success';

export const FETCH_CORE_STREAMS = 'fetch/streams/core';
export const FETCH_CORE_STREAMS_SUCCESS = 'fetch/streams/core/success';

export type ActionTypes =
  | FetchTenantStreamsAction
  | FetchTenantStreamsSuccessAction
  | FetchCoreStreamsAction
  | FetchCoreStreamsSuccessAction;

export interface FetchTenantStreamsAction {
  type: typeof FETCH_TENANT_STREAMS;
}

export interface FetchTenantStreamsSuccessAction {
  type: typeof FETCH_TENANT_STREAMS_SUCCESS;
  payload: Streams;
}

export interface FetchCoreStreamsAction {
  type: typeof FETCH_CORE_STREAMS;
}

export interface FetchCoreStreamsSuccessAction {
  type: typeof FETCH_CORE_STREAMS_SUCCESS;
  payload: Streams;
}

export const fetchTenantStreams = (): FetchTenantStreamsAction => ({
  type: FETCH_TENANT_STREAMS,
});

export const fetchTenantStreamsSuccess = (data: Streams): FetchTenantStreamsSuccessAction => ({
  type: FETCH_TENANT_STREAMS_SUCCESS,
  payload: data,
});

export const fetchCoreStreams = (): FetchCoreStreamsAction => ({
  type: FETCH_CORE_STREAMS,
});

export const fetchCoreStreamsSuccess = (data: Streams): FetchCoreStreamsSuccessAction => ({
  type: FETCH_CORE_STREAMS_SUCCESS,
  payload: data,
});
