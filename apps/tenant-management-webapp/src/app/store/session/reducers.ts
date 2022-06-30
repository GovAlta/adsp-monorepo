import { ActionType, SET_SESSION_EXPIRED } from './actions';
import { Session, SESSION_INIT } from './models';

export default function (state: Session = SESSION_INIT, action: ActionType): Session {
  switch (action.type) {
    case 'session/login/success':
      return {
        ...state,
        ...action.payload,
        credentials: {
          ...state.credentials,
          ...action.payload.credentials,
        },
      };
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
    case 'session/elementIndicator':
      return {
        ...state,
        elementIndicator: {
          ...action.payload,
        },
      };

    case 'session/logout':
      return SESSION_INIT;

    case 'session/loading/state': {
      const index = state.loadingStates.findIndex((state) => {
        return state.name === action.payload.name;
      });

      if (index === -1) {
        state.loadingStates.push(action.payload);
      } else {
        state.loadingStates[index] = action.payload;
      }
      state.loadingStates = [...state.loadingStates];
      return state;
    }

    case SET_SESSION_EXPIRED:
      return {
        ...state,
        isExpired: action.payload,
      };

    default:
      return state;
  }
}
