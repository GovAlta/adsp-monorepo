import { ConfigState } from './models';

export const FETCH_CONFIG_ACTION = 'config/fetch-config';
export const FETCH_CONFIG_SUCCESS_ACTION = 'config/fetch-config-success';

export interface FetchConfigAction {
  type: typeof FETCH_CONFIG_ACTION;
}

export interface FetchConfigSuccessAction {
  type: typeof FETCH_CONFIG_SUCCESS_ACTION;
  payload: ConfigState;
}

export type ActionTypes = FetchConfigAction | FetchConfigSuccessAction;

export const fetchConfig = (): FetchConfigAction => ({
  type: 'config/fetch-config',
});
