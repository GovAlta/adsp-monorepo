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
export const VERIFY_SHAREPOINT_DESTINATION_ACTION = 'sharepoint/VERIFY_SHAREPOINT_DESTINATION_ACTION';
export const VERIFY_SHAREPOINT_DESTINATION_SUCCESS_ACTION = 'sharepoint/VERIFY_SHAREPOINT_DESTINATION_SUCCESS_ACTION';
export const SET_UP_SHAREPOINT_DESTINATION_ACTION = 'sharepoint/SET_UP_SHAREPOINT_DESTINATION_ACTION';
export const SET_UP_SHAREPOINT_DESTINATION_SUCCESS_ACTION = 'sharepoint/SET_UP_SHAREPOINT_DESTINATION_SUCCESS_ACTION';
export const FETCH_SHAREPOINT_FORMS_ACTION = 'sharepoint/FETCH_SHAREPOINT_FORMS_ACTION';
export const FETCH_SHAREPOINT_FORMS_SUCCESS_ACTION = 'sharepoint/FETCH_SHAREPOINT_FORMS_SUCCESS_ACTION';

// Only what Generate Form Service mappings needs from each form definition.
export interface SharepointFormChoice {
  id: string;
  name: string;
  sharepointConfigurationId?: string | null;
  dataSchema?: Record<string, unknown>;
}

export interface SharepointConnection {
  id: string;
  name: string;
  entraTenantId: string;
  clientId: string;
  siteId: string;
}

export type SharepointColumnType =
  | 'text'
  | 'multilineText'
  | 'number'
  | 'dateTime'
  | 'boolean'
  | 'multiChoice'
  | 'hyperlink';

export interface SharepointFieldMapping {
  source: string;
  target: string;
  linkFormat?: 'hyperlink' | 'text';
  columnType?: SharepointColumnType;
  displayName?: string;
  choices?: string[];
}

export interface SharepointDetailList {
  listId?: string;
  listName?: string;
  dataPath: string;
  parentRefField: string;
  fieldMappings: SharepointFieldMapping[];
}

export interface SharepointDestination {
  id: string;
  name: string;
  connectionId: string;
  listId: string;
  fieldMappings: SharepointFieldMapping[];
  idempotencyFields?: string[];
  enabled?: boolean;
  folderLinkField?: string;
  detailLists?: SharepointDetailList[];
}

export interface SharepointConfiguration {
  connections: Record<string, SharepointConnection>;
  destinations: Record<string, SharepointDestination>;
}

export interface SharepointCredentialStatus {
  isSet: boolean;
  updatedAt?: string;
}

export interface SharepointDetailRows {
  listId: string;
  rowIds: string[];
}

export interface SharepointDetailFailure {
  listId: string;
  indexes: number[];
  oldRowsLeft?: number;
  newRowsLeft?: number;
  column?: string;
}

export type SharepointTestResult =
  | { ok: true; outcome: 'created' | 'updated'; detailRows?: SharepointDetailRows[] }
  | { ok: false; errorCode: string; column?: string; detailFailures?: SharepointDetailFailure[] };

export interface SharepointColumnReport {
  name: string;
  displayName: string;
  purpose: 'key' | 'parent' | 'folder' | 'mapped';
  expectedType?: SharepointColumnType;
  status: 'ok' | 'missing' | 'notIndexed' | 'wrongType';
  actualType?: string;
  matchingName?: string;
}

export interface SharepointListReport {
  kind: 'main' | 'detail';
  listId?: string;
  listName?: string;
  dataPath?: string;
  status: 'ok' | 'notCreated' | 'notFound';
  columns: SharepointColumnReport[];
}

export interface SharepointVerifyReport {
  ready: boolean;
  lists: SharepointListReport[];
}

export interface SharepointCreatedList {
  index: number;
  dataPath: string;
  listName: string;
  listId: string;
}

export interface SharepointSetupSummary {
  createdLists: SharepointCreatedList[];
  createdColumns: { listId: string; name: string }[];
  indexedColumns: { listId: string; name: string }[];
  failures: { listId?: string; name?: string; errorCode: string }[];
  permissionDenied: boolean;
}

// One entry per destination: the latest report, plus what the last setup did or why it stopped.
export interface SharepointVerifyState {
  loading: boolean;
  report?: SharepointVerifyReport;
  errorCode?: string;
  setup?: SharepointSetupSummary;
  listNameTaken?: SharepointCreatedList[];
}

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
  verifyAfterSave?: boolean;
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
export interface VerifySharepointDestinationAction {
  type: typeof VERIFY_SHAREPOINT_DESTINATION_ACTION;
  id: string;
}
export interface VerifySharepointDestinationSuccessAction {
  type: typeof VERIFY_SHAREPOINT_DESTINATION_SUCCESS_ACTION;
  id: string;
  payload: Omit<SharepointVerifyState, 'loading'>;
}
export interface SetUpSharepointDestinationAction {
  type: typeof SET_UP_SHAREPOINT_DESTINATION_ACTION;
  id: string;
}
export interface SetUpSharepointDestinationSuccessAction {
  type: typeof SET_UP_SHAREPOINT_DESTINATION_SUCCESS_ACTION;
  id: string;
  payload: Omit<SharepointVerifyState, 'loading'>;
}
export interface FetchSharepointFormsAction {
  type: typeof FETCH_SHAREPOINT_FORMS_ACTION;
}
export interface FetchSharepointFormsSuccessAction {
  type: typeof FETCH_SHAREPOINT_FORMS_SUCCESS_ACTION;
  payload: SharepointFormChoice[];
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
  | TestSharepointDestinationSuccessAction
  | VerifySharepointDestinationAction
  | VerifySharepointDestinationSuccessAction
  | SetUpSharepointDestinationAction
  | SetUpSharepointDestinationSuccessAction
  | FetchSharepointFormsAction
  | FetchSharepointFormsSuccessAction;

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

export const updateSharepointDestination = (
  payload: SharepointDestination,
  verifyAfterSave = false,
): UpdateSharepointDestinationAction => ({
  type: UPDATE_SHAREPOINT_DESTINATION_ACTION,
  payload,
  verifyAfterSave,
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

export const verifySharepointDestination = (id: string): VerifySharepointDestinationAction => ({
  type: VERIFY_SHAREPOINT_DESTINATION_ACTION,
  id,
});

export const verifySharepointDestinationSuccess = (
  id: string,
  payload: Omit<SharepointVerifyState, 'loading'>,
): VerifySharepointDestinationSuccessAction => ({ type: VERIFY_SHAREPOINT_DESTINATION_SUCCESS_ACTION, id, payload });

export const setUpSharepointDestination = (id: string): SetUpSharepointDestinationAction => ({
  type: SET_UP_SHAREPOINT_DESTINATION_ACTION,
  id,
});

export const fetchSharepointForms = (): FetchSharepointFormsAction => ({ type: FETCH_SHAREPOINT_FORMS_ACTION });

export const fetchSharepointFormsSuccess = (payload: SharepointFormChoice[]): FetchSharepointFormsSuccessAction => ({
  type: FETCH_SHAREPOINT_FORMS_SUCCESS_ACTION,
  payload,
});

export const setUpSharepointDestinationSuccess = (
  id: string,
  payload: Omit<SharepointVerifyState, 'loading'>,
): SetUpSharepointDestinationSuccessAction => ({ type: SET_UP_SHAREPOINT_DESTINATION_SUCCESS_ACTION, id, payload });
