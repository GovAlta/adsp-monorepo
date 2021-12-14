import { Credentials, Session, Indicator } from './models';

export const SESSION_LOGIN_SUCCESS = 'session/login/success';
export const SESSION_LOGIN_FAILED = 'session/login/failed';
export const SESSION_LOGOUT = 'session/logout';
export const CREDENTIAL_REFRESH = 'credential/refresh';
export const UPDATE_INDICATOR = 'session/indicator';

export type ActionType = SessionLoginSuccessAction | SessionLogoutAction | CredentialRefreshAction | UpdateIndicatorAction
  ;

interface CredentialRefreshAction {
  type: typeof CREDENTIAL_REFRESH;
  payload: Credentials;
}

interface SessionLoginSuccessAction {
  type: typeof SESSION_LOGIN_SUCCESS;
  payload: Session;
}

interface SessionLogoutAction {
  type: typeof SESSION_LOGOUT;
}

interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator
}


export const SessionLoginSuccess = (session: Session): SessionLoginSuccessAction => ({
  type: 'session/login/success',
  payload: session,
});

export const SessionLogout = (): SessionLogoutAction => ({
  type: 'session/logout',
});

export const CredentialRefresh = (credentials: Credentials): CredentialRefreshAction => ({
  type: 'credential/refresh',
  payload: credentials,
});

export const UpdateIndicator = (indicator: Indicator ): UpdateIndicatorAction => ({
  type: 'session/indicator',
  payload: indicator,
});
