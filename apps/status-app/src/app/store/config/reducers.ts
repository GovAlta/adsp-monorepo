import { ConfigState, CONFIG_INIT } from './models';
import { ActionTypes, FETCH_CONFIG_SUCCESS_ACTION, RECAPTCHA_SCRIPT_LOADED_ACTION } from './actions';

export default function (state: ConfigState = CONFIG_INIT, action: ActionTypes): ConfigState {
  switch (action.type) {
    case FETCH_CONFIG_SUCCESS_ACTION:
      return {
        ...state,
        ...action.payload,
        envLoaded: true,
      };
    case RECAPTCHA_SCRIPT_LOADED_ACTION:
      return {
        ...state,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grecaptcha: (window as any).grecaptcha,
      };
    default:
      return state;
  }
}
