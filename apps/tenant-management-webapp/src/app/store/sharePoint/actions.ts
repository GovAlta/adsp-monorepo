export const FETCH_SHAREPOINT_CONFIGURATION_ACTION = 'sharepoint/FETCH_SHAREPOINT_CONFIGURATION_ACTION';
export const FETCH_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION = 'sharepoint/FETCH_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION';
export const UPDATE_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION =
  'sharepoint/UPDATE_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION';
export const UPDATE_SHAREPOINT_CONNECTION_ACTION = 'sharepoint/UPDATE_SHAREPOINT_CONNECTION_ACTION';
export const DELETE_SHAREPOINT_CONNECTION_ACTION = 'sharepoint/DELETE_SHAREPOINT_CONNECTION_ACTION';
export const UPDATE_SHAREPOINT_DESTINATION_ACTION = 'sharepoint/UPDATE_SHAREPOINT_DESTINATION_ACTION';
export const DELETE_SHAREPOINT_DESTINATION_ACTION = 'sharepoint/DELETE_SHAREPOINT_DESTINATION_ACTION';
export const FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION = 'sharepoint/FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION';
export const FETCH_SHAREPOINT_CREDENTIAL_STATUS_SUCCESS_ACTION =
  'sharepoint/FETCH_SHAREPOINT_CREDENTIAL_STATUS_SUCCESS_ACTION';
export const TEST_SHAREPOINT_DESTINATION_ACTION = 'sharepoint/TEST_SHAREPOINT_DESTINATION_ACTION';
export const TEST_SHAREPOINT_DESTINATION_SUCCESS_ACTION = 'sharepoint/TEST_SHAREPOINT_DESTINATION_SUCCESS_ACTION';

export interface SharepointConnection {
  id: string;
  name: string;
  entraTenantId: string;
  clientId: string;
  siteId: string;
}

export interface SharepointFieldMapping {
  source: string;
  target: string;
}

export interface SharepointDestination {
  id: string;
  name: string;
  connectionId: string;
  listId: string;
  fieldMappings: SharepointFieldMapping[];
  idempotencyFields?: string[];
  enabled?: boolean;
}

export interface SharepointConfiguration {
  connections: Record<string, SharepointConnection>;
  destinations: Record<string, SharepointDestination>;
}

export interface SharepointCredentialStatus {
  isSet: boolean;
  updatedAt?: string;
}

export type SharepointTestResult = { ok: true } | { ok: false; errorCode: string; column?: string };

export interface FetchSharepointConfigurationAction {
  type: typeof FETCH_SHAREPOINT_CONFIGURATION_ACTION;
}
export interface FetchSharepointConfigurationSuccessAction {
  type: typeof FETCH_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION;
  payload: SharepointConfiguration;
}
export interface UpdateSharepointConfigurationSuccessAction {
  type: typeof UPDATE_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION;
  payload: SharepointConfiguration;
}
export interface UpdateSharepointConnectionAction {
  type: typeof UPDATE_SHAREPOINT_CONNECTION_ACTION;
  payload: { connection: SharepointConnection; clientSecret?: string };
}
export interface DeleteSharepointConnectionAction {
  type: typeof DELETE_SHAREPOINT_CONNECTION_ACTION;
  id: string;
}
export interface UpdateSharepointDestinationAction {
  type: typeof UPDATE_SHAREPOINT_DESTINATION_ACTION;
  payload: SharepointDestination;
}
export interface DeleteSharepointDestinationAction {
  type: typeof DELETE_SHAREPOINT_DESTINATION_ACTION;
  id: string;
}
export interface FetchSharepointCredentialStatusAction {
  type: typeof FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION;
  id: string;
}
export interface FetchSharepointCredentialStatusSuccessAction {
  type: typeof FETCH_SHAREPOINT_CREDENTIAL_STATUS_SUCCESS_ACTION;
  id: string;
  payload: SharepointCredentialStatus;
}
export interface TestSharepointDestinationAction {
  type: typeof TEST_SHAREPOINT_DESTINATION_ACTION;
  id: string;
  data: Record<string, unknown>;
}
export interface TestSharepointDestinationSuccessAction {
  type: typeof TEST_SHAREPOINT_DESTINATION_SUCCESS_ACTION;
  id: string;
  payload: SharepointTestResult;
}

export type SharepointActionTypes =
  | FetchSharepointConfigurationAction
  | FetchSharepointConfigurationSuccessAction
  | UpdateSharepointConfigurationSuccessAction
  | UpdateSharepointConnectionAction
  | DeleteSharepointConnectionAction
  | UpdateSharepointDestinationAction
  | DeleteSharepointDestinationAction
  | FetchSharepointCredentialStatusAction
  | FetchSharepointCredentialStatusSuccessAction
  | TestSharepointDestinationAction
  | TestSharepointDestinationSuccessAction;

export const fetchSharepointConfiguration = (): FetchSharepointConfigurationAction => ({
  type: FETCH_SHAREPOINT_CONFIGURATION_ACTION,
});

export const fetchSharepointConfigurationSuccess = (
  payload: SharepointConfiguration,
): FetchSharepointConfigurationSuccessAction => ({ type: FETCH_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION, payload });

export const updateSharepointConfigurationSuccess = (
  payload: SharepointConfiguration,
): UpdateSharepointConfigurationSuccessAction => ({ type: UPDATE_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION, payload });

export const updateSharepointConnection = (
  connection: SharepointConnection,
  clientSecret?: string,
): UpdateSharepointConnectionAction => ({
  type: UPDATE_SHAREPOINT_CONNECTION_ACTION,
  payload: { connection, clientSecret },
});

export const deleteSharepointConnection = (id: string): DeleteSharepointConnectionAction => ({
  type: DELETE_SHAREPOINT_CONNECTION_ACTION,
  id,
});

export const updateSharepointDestination = (payload: SharepointDestination): UpdateSharepointDestinationAction => ({
  type: UPDATE_SHAREPOINT_DESTINATION_ACTION,
  payload,
});

export const deleteSharepointDestination = (id: string): DeleteSharepointDestinationAction => ({
  type: DELETE_SHAREPOINT_DESTINATION_ACTION,
  id,
});

export const fetchSharepointCredentialStatus = (id: string): FetchSharepointCredentialStatusAction => ({
  type: FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION,
  id,
});

export const fetchSharepointCredentialStatusSuccess = (
  id: string,
  payload: SharepointCredentialStatus,
): FetchSharepointCredentialStatusSuccessAction => ({
  type: FETCH_SHAREPOINT_CREDENTIAL_STATUS_SUCCESS_ACTION,
  id,
  payload,
});

export const testSharepointDestination = (
  id: string,
  data: Record<string, unknown>,
): TestSharepointDestinationAction => ({
  type: TEST_SHAREPOINT_DESTINATION_ACTION,
  id,
  data,
});

export const testSharepointDestinationSuccess = (
  id: string,
  payload: SharepointTestResult,
): TestSharepointDestinationSuccessAction => ({ type: TEST_SHAREPOINT_DESTINATION_SUCCESS_ACTION, id, payload });
