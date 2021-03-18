import { ConfigState } from './models';

export const FETCH_CONFIG_ACTION = 'config/fetch-config';
export const FETCH_CONFIG_SUCCESS_ACTION = 'config/fetch-config-success';
export const UPDATE_CONFIG_REALM_ACTION = 'config/update-config-realm';

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

export type ActionTypes = FetchConfigAction | FetchConfigSuccessAction | UpdateConfigRealmAction;

export const fetchConfig = (): FetchConfigAction => ({
  type: FETCH_CONFIG_ACTION,
});

export const fetchConfigSuccess = (params: ConfigState): FetchConfigSuccessAction => ({
  type: FETCH_CONFIG_SUCCESS_ACTION,
  payload: params,
});

export const UpdateConfigRealm = (realm: string): UpdateConfigRealmAction => ({
  type: UPDATE_CONFIG_REALM_ACTION,
  payload: realm,
});
