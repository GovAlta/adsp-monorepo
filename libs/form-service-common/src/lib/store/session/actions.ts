
import { Credentials, Session, Indicator, ElementIndicator, LoadingState, ModalState } from './models';


export const SET_SESSION = 'set/session';
export const CREDENTIAL_REFRESH = 'credential/refresh';
export const UPDATE_INDICATOR = 'session/indicator';
export const UPDATE_ELEMENT_INDICATOR = 'session/elementIndicator';
export const UPDATE_LOADING_STATE = 'session/loading/state';
export const SET_SESSION_EXPIRED = 'session/expired';


export type ActionType =
  | CredentialRefreshAction
  | UpdateIndicatorAction
  | UpdateLoadingStateAction
  | UpdateElementIndicatorAction
  | SetSessionExpiredAction
  | SetTokenAction;

export interface CredentialRefreshAction {
  type: typeof CREDENTIAL_REFRESH;
  payload: Credentials;
}


export interface SetTokenAction {
  type: typeof SET_SESSION;
  payload: Session;
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

export const SetSession = (session: Session): SetTokenAction => ({
  type: SET_SESSION,
  payload: session,
});
