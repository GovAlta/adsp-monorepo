import { ConfigState, CONFIG_INIT } from './models';
import { ActionTypes } from './actions';

export default function (state: ConfigState = CONFIG_INIT, action: ActionTypes): ConfigState {
  switch (action.type) {
    case 'config/fetch-config-success': {
      return {
        ...state,
        ...action.payload,
        envLoaded: true,
      };
    }
    default:
      return state;
  }
}
