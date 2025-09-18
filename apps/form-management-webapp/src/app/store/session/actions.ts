import { Credentials, Session, Indicator, ElementIndicator, LoadingState, ModalState } from './models';

export const SESSION_LOGIN_SUCCESS = 'session/login/success';
export const SESSION_LOGOUT = 'session/logout';
export const CREDENTIAL_REFRESH = 'credential/refresh';
export const UPDATE_INDICATOR = 'session/indicator';
export const UPDATE_ELEMENT_INDICATOR = 'session/elementIndicator';
export const UPDATE_LOADING_STATE = 'session/loading/state';
export const SET_SESSION_EXPIRED = 'session/expired';
export const UPDATE_RESOURCE_ACCESS = 'session/resourceAccess/update';
export const SET_SESSION_WILL_EXPIRED = 'session/will/expired';
export const UPDATE_MODAL_STATE = 'session/modal/update';
export const RESET_MODAL_STATE = 'session/modal/reset';
export const RESET_LOADING_STATE = 'session/loading-state/reset';

export type ActionType =
  | SessionLoginSuccessAction
  | SessionLogoutAction
  | CredentialRefreshAction
  | UpdateIndicatorAction
  | UpdateLoadingStateAction
  | UpdateElementIndicatorAction
  | SetSessionExpiredAction
  | SetSessionWillExpiredAction
  | UpdateModalStateAction
  | ResetModalStateAction
  | ResetLoadingStateAction
  | UpdateResourceAccessAction;

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

export interface SetSessionExpiredAction {
  type: typeof SET_SESSION_EXPIRED;
  payload: boolean;
}

export interface SetSessionWillExpiredAction {
  type: typeof SET_SESSION_WILL_EXPIRED;
  payload: boolean;
}

export interface UpdateResourceAccessAction {
  type: typeof UPDATE_RESOURCE_ACCESS;
  payload: {
    clientId: string;
    role: string;
  };
}

export interface ResetLoadingStateAction {
  type: typeof RESET_LOADING_STATE;
}

export interface ResetModalStateAction {
  type: typeof RESET_MODAL_STATE;
}

export interface UpdateModalStateAction {
  type: typeof UPDATE_MODAL_STATE;
  payload: ModalState;
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

export const SetSessionExpired = (isExpired: boolean): SetSessionExpiredAction => ({
  type: SET_SESSION_EXPIRED,
  payload: isExpired,
});

export const UpdateResourceAccess = (clientId: string, role: string): UpdateResourceAccessAction => ({
  type: UPDATE_RESOURCE_ACCESS,
  payload: {
    clientId,
    role,
  },
});

export const SetSessionWillExpired = (isExpired: boolean): SetSessionWillExpiredAction => ({
  type: SET_SESSION_WILL_EXPIRED,
  payload: isExpired,
});

export const UpdateModalState = (modalState: ModalState) => ({
  type: UPDATE_MODAL_STATE,
  payload: modalState,
});

export const ResetModalState = () => ({
  type: RESET_MODAL_STATE,
});

export const ResetLoadingState = () => ({
  type: RESET_LOADING_STATE,
});
