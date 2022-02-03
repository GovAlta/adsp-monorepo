import { ConfigValues } from './models';

export const FETCH_CONFIG_ACTION = 'config/fetch-config';
export const FETCH_CONFIG_SUCCESS_ACTION = 'config/fetch-config-success';

export const RECAPTCHA_SCRIPT_LOADED_ACTION = 'config/recaptcha-script-loaded';

interface FetchConfigAction {
  type: typeof FETCH_CONFIG_ACTION;
}

interface FetchConfigSuccessAction {
  type: typeof FETCH_CONFIG_SUCCESS_ACTION;
  payload: ConfigValues;
}

interface RecaptchaScriptLoadedAction {
  type: typeof RECAPTCHA_SCRIPT_LOADED_ACTION;
}

export type ActionTypes = FetchConfigAction | FetchConfigSuccessAction | RecaptchaScriptLoadedAction;

export const fetchConfig = (): FetchConfigAction => ({
  type: FETCH_CONFIG_ACTION,
});

export const fetchConfigSuccess = (config: ConfigValues): FetchConfigSuccessAction => ({
  type: FETCH_CONFIG_SUCCESS_ACTION,
  payload: config,
});

export const recaptchaScriptLoaded = (): RecaptchaScriptLoadedAction => ({
  type: RECAPTCHA_SCRIPT_LOADED_ACTION,
});
