import { ActionType } from './actions';
import { Session, SESSION_INIT } from './models';

export default function (state: Session = SESSION_INIT, action: ActionType): Session {
  switch (action.type) {
    case 'session/login/success': {
      const payloadKeys = Object.keys(action.payload);
      let returnObject = state;
      const modifiedKeys = [];

      for (let i = 0; i < payloadKeys.length; i++) {
        if (JSON.stringify(state[payloadKeys[i]]) !== JSON.stringify(action.payload[payloadKeys[i]])) {
          modifiedKeys.push(payloadKeys[i]);
          returnObject = { ...returnObject, [payloadKeys[i]]: action.payload[payloadKeys[i]] };
        }
      }

      if (modifiedKeys[0] === 'credentials' && modifiedKeys.length === 1) {
        state.credentials = action.payload.credentials;
        return state;
      } else {
        return returnObject;
      }
    }

    case 'credential/refresh':
      return {
        ...state,
        credentials: {
          ...state.credentials,
          ...action.payload,
        },
      };

    case 'session/indicator':
      return {
        ...state,
        indicator: {
          ...action.payload,
        },
      };

    case 'session/logout':
      return SESSION_INIT;

    default:
      return state;
  }
}
