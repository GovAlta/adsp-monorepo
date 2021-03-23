import { ConfigState, CONFIG_INIT } from './models';
import { ActionTypes } from './actions';

export default function (state: ConfigState = CONFIG_INIT, action: ActionTypes): ConfigState {
  switch (action.type) {
    case 'config/fetch-config-success':
      return {
        ...state,
        ...action.payload,
      };

    case 'config/update-config-realm':
      return {
        ...state,
        keycloakApi: {
          ...state.keycloakApi,
          realm: action.payload,
        },
      };

    default:
      return state;
  }
}
