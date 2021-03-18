import { ConfigState, CONFIG_INIT } from './models';
import { ActionTypes } from './actions';
let keycloakApi = null;

export default function (state: ConfigState = CONFIG_INIT, action: ActionTypes): ConfigState {
  switch (action.type) {
    case 'config/fetch-config-success':
      return {
        ...state,
        ...action.payload,
      };

    case 'config/update-config-realm':
      keycloakApi = state.keycloakApi;
      keycloakApi.realm = action.payload;

      return {
        ...state,
        keycloakApi: keycloakApi,
      };

    default:
      return state;
  }
}
