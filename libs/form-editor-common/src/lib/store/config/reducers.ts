import { ConfigState, CONFIG_INIT } from './models';
import { ActionTypes } from './actions';

export default function (state: ConfigState = CONFIG_INIT, action: ActionTypes): ConfigState {
  switch (action.type) {
    case 'form-service-common/config/fetch-config-success':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
