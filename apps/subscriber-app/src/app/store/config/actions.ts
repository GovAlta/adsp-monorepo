import { ConfigState } from './models';

export const FETCH_CONFIG_ACTION = 'config/fetch-config';
export const FETCH_CONFIG_SUCCESS_ACTION = 'config/fetch-config-success';
export const UPDATE_CONFIG_REALM_ACTION = 'config/update-config-realm';
export const LOGOUT_CONFIG_ACTION = 'config/logout';
export const RECAPTCHA_SCRIPT_LOADED_ACTION = 'config/recaptcha-script-loaded';

export interface FetchConfigAction {
  type: typeof FETCH_CONFIG_ACTION;
}

export interface FetchConfigSuccessAction {
  type: typeof FETCH_CONFIG_SUCCESS_ACTION;
  payload: ConfigState;
}

export interface UpdateConfigRealmAction {
  type: typeof UPDATE_CONFIG_REALM_ACTION;
  payload: string;
}

export interface LogoutConfigAction {
  type: typeof LOGOUT_CONFIG_ACTION;
}

interface RecaptchaScriptLoadedAction {
  type: typeof RECAPTCHA_SCRIPT_LOADED_ACTION;
}

export type ActionTypes =
  | FetchConfigAction
  | FetchConfigSuccessAction
  | UpdateConfigRealmAction
  | LogoutConfigAction
  | RecaptchaScriptLoadedAction;

export const fetchConfig = (): FetchConfigAction => ({
  type: 'config/fetch-config',
});

export const fetchConfigSuccess = (params: ConfigState): FetchConfigSuccessAction => ({
  type: 'config/fetch-config-success',
  payload: params,
});

export const UpdateConfigRealm = (realm: string): UpdateConfigRealmAction => ({
  type: 'config/update-config-realm',
  payload: realm,
});

export const ConfigLogout = (): LogoutConfigAction => ({
  type: 'config/logout',
});

export const recaptchaScriptLoaded = (): RecaptchaScriptLoadedAction => ({
  type: RECAPTCHA_SCRIPT_LOADED_ACTION,
});
