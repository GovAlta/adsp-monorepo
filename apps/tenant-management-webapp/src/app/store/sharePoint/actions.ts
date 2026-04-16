export const FETCH_SHAREPOINT_CONNECTIONS_ACTION = 'sharepoint/FETCH_SHAREPOINT_CONNECTIONS_ACTION';
export const FETCH_SHAREPOINT_CONNECTIONS_SUCCESS_ACTION = 'sharepoint/FETCH_SHAREPOINT_CONNECTIONS_SUCCESS_ACTION';

export const UPDATE_SHAREPOINT_CONNECTION_ACTION = 'sharepoint/UPDATE_SHAREPOINT_CONNECTION_ACTION';
export const UPDATE_SHAREPOINT_CONNECTION_SUCCESS_ACTION = 'sharepoint/UPDATE_SHAREPOINT_CONNECTION_SUCCESS_ACTION';

export const DELETE_SHAREPOINT_CONNECTION_ACTION = 'sharepoint/DELETE_SHAREPOINT_CONNECTION_ACTION';
export const DELETE_SHAREPOINT_CONNECTION_SUCCESS_ACTION = 'sharepoint/DELETE_SHAREPOINT_CONNECTION_SUCCESS_ACTION';

export interface SharepointConnection {
  id: string;
  tenantId: string;
  siteId: string;
  listId: string;
  clientId: string;
}

export interface FetchSharepointConnectionsAction {
  type: typeof FETCH_SHAREPOINT_CONNECTIONS_ACTION;
}

export interface FetchSharepointConnectionsSuccessAction {
  type: typeof FETCH_SHAREPOINT_CONNECTIONS_SUCCESS_ACTION;
  payload: Record<string, SharepointConnection>;
}

export interface UpdateSharepointConnectionAction {
  type: typeof UPDATE_SHAREPOINT_CONNECTION_ACTION;
  payload: SharepointConnection;
}

export interface UpdateSharepointConnectionSuccessAction {
  type: typeof UPDATE_SHAREPOINT_CONNECTION_SUCCESS_ACTION;
  payload: Record<string, SharepointConnection>;
}

export interface DeleteSharepointConnectionAction {
  type: typeof DELETE_SHAREPOINT_CONNECTION_ACTION;
  id: string;
}

export interface DeleteSharepointConnectionSuccessAction {
  type: typeof DELETE_SHAREPOINT_CONNECTION_SUCCESS_ACTION;
  payload: Record<string, SharepointConnection>;
}

export type SharepointConnectionActionTypes =
  | FetchSharepointConnectionsAction
  | FetchSharepointConnectionsSuccessAction
  | UpdateSharepointConnectionAction
  | UpdateSharepointConnectionSuccessAction
  | DeleteSharepointConnectionAction
  | DeleteSharepointConnectionSuccessAction;

export const fetchSharepointConnections = (): FetchSharepointConnectionsAction => ({
  type: FETCH_SHAREPOINT_CONNECTIONS_ACTION,
});

export const fetchSharepointConnectionsSuccess = (
  payload: Record<string, SharepointConnection>,
): FetchSharepointConnectionsSuccessAction => ({
  type: FETCH_SHAREPOINT_CONNECTIONS_SUCCESS_ACTION,
  payload,
});

export const updateSharepointConnection = (payload: SharepointConnection): UpdateSharepointConnectionAction => ({
  type: UPDATE_SHAREPOINT_CONNECTION_ACTION,
  payload,
});

export const updateSharepointConnectionSuccess = (
  payload: Record<string, SharepointConnection>,
): UpdateSharepointConnectionSuccessAction => ({
  type: UPDATE_SHAREPOINT_CONNECTION_SUCCESS_ACTION,
  payload,
});

export const deleteSharepointConnection = (id: string): DeleteSharepointConnectionAction => ({
  type: DELETE_SHAREPOINT_CONNECTION_ACTION,
  id,
});

export const deleteSharepointConnectionSuccess = (
  payload: Record<string, SharepointConnection>,
): DeleteSharepointConnectionSuccessAction => ({
  type: DELETE_SHAREPOINT_CONNECTION_SUCCESS_ACTION,
  payload,
});
