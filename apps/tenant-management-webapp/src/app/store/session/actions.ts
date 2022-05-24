import { Credentials, Session, Indicator, ElementIndicator, LoadingState } from './models';

export const SESSION_LOGIN_SUCCESS = 'session/login/success';
export const SESSION_LOGOUT = 'session/logout';
export const CREDENTIAL_REFRESH = 'credential/refresh';
export const UPDATE_INDICATOR = 'session/indicator';
export const UPDATE_ELEMENT_INDICATOR = 'session/elementIndicator';
export const UPDATE_LOADING_STATE = 'session/loading/state';

export type ActionType =
  | SessionLoginSuccessAction
  | SessionLogoutAction
  | CredentialRefreshAction
  | UpdateIndicatorAction
  | UpdateLoadingStateAction
  | UpdateElementIndicatorAction;

export interface CredentialRefreshAction {
  type: typeof CREDENTIAL_REFRESH;
  payload: Credentials;
}

export interface SessionLoginSuccessAction {
  type: typeof SESSION_LOGIN_SUCCESS;
  payload: Session;
}

export interface SessionLogoutAction {
  type: typeof SESSION_LOGOUT;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}

export interface UpdateLoadingStateAction {
  type: typeof UPDATE_LOADING_STATE;
  payload: LoadingState;
}

export interface UpdateElementIndicatorAction {
  type: typeof UPDATE_ELEMENT_INDICATOR;
  payload: ElementIndicator;
}

export const SessionLoginSuccess = (session: Session): SessionLoginSuccessAction => ({
  type: SESSION_LOGIN_SUCCESS,
  payload: session,
});

export const SessionLogout = (): SessionLogoutAction => ({
  type: SESSION_LOGOUT,
});

export const CredentialRefresh = (credentials: Credentials): CredentialRefreshAction => ({
  type: CREDENTIAL_REFRESH,
  payload: credentials,
});

export const UpdateElementIndicator = (elementIndicator: ElementIndicator): UpdateElementIndicatorAction => ({
  type: UPDATE_ELEMENT_INDICATOR,
  payload: elementIndicator,
});

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});

export const UpdateLoadingState = (loadingState: LoadingState): UpdateLoadingStateAction => ({
  type: UPDATE_LOADING_STATE,
  payload: loadingState,
});
