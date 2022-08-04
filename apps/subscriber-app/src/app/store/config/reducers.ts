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

    case 'config/logout':
      return {
        ...state,
        keycloakApi: {
          ...state.keycloakApi,
          realm: 'core',
        },
      };

    case 'config/recaptcha-script-loaded':
      return {
        ...state,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grecaptcha: (window as any).grecaptcha,
      };

    default:
      return state;
  }
}
