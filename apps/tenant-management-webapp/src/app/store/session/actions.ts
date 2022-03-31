import { Credentials, Session, Indicator } from './models';

export const SESSION_LOGIN_SUCCESS = 'session/login/success';
export const SESSION_LOGOUT = 'session/logout';
export const CREDENTIAL_REFRESH = 'credential/refresh';
export const UPDATE_INDICATOR = 'session/indicator';

export type ActionType =
  | SessionLoginSuccessAction
  | SessionLogoutAction
  | CredentialRefreshAction
  | UpdateIndicatorAction;

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

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});
