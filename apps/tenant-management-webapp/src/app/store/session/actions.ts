import { Session } from "./models";

export const SESSION_LOGIN_SUCCESS = 'session/login/success';
export const SESSION_LOGIN_FAILED = 'session/login/failed';
export const SESSION_LOGOUT = 'session/logout';

export type ActionType = SessionLoginSuccessAction | SessionLogoutAction;

interface SessionLoginSuccessAction {
  type: typeof SESSION_LOGIN_SUCCESS;
  payload: Session;
}

interface SessionLogoutAction {
  type: typeof SESSION_LOGOUT;
}

export const SessionLoginSuccess = (payload: Session): SessionLoginSuccessAction => ({
  type: SESSION_LOGIN_SUCCESS,
  payload,
});

export const SessionLogout = (): SessionLogoutAction => ({
  type: SESSION_LOGOUT,
});
