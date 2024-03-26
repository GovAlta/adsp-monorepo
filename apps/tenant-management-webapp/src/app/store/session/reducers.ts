import {
  ActionType,
  SET_SESSION_EXPIRED,
  SET_SESSION_WILL_EXPIRED,
  UPDATE_MODAL_STATE,
  RESET_MODAL_STATE,
  RESET_LOADING_STATE,
} from './actions';
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
        isWillExpired: false,
      };

    case 'session/indicator': {
      if (action.payload?.show !== null) {
        state.indicator = {
          ...state.indicator,
          show: action.payload?.show,
          message: action.payload?.message,
        };
      }

      if (action.payload.details) {
        state.indicator = {
          ...state.indicator,
          details: {
            ...state.indicator.details,
            ...action.payload?.details,
          },
        };
      }
      return {
        ...state,
      };
    }
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
      return { ...state };
    }

    case 'session/resourceAccess/update': {
      const { clientId, role } = action.payload;
      state.resourceAccess = {
        ...state.resourceAccess,
      };
      if (!(clientId in state.resourceAccess)) {
        state.resourceAccess[clientId] = {
          roles: [role],
        };
      } else {
        if (!state.resourceAccess[clientId].roles.includes(role)) {
          state.resourceAccess[clientId].roles.push(role);
        }
      }
      return state;
    }

    case UPDATE_MODAL_STATE: {
      state.modal = {
        ...state.modal,
      };

      state.modal[action.payload.type] = action.payload;

      return { ...state };
    }

    case RESET_MODAL_STATE: {
      state.modal = {};
      return { ...state };
    }

    case SET_SESSION_EXPIRED:
      return {
        ...state,
        isExpired: action.payload,
      };
    case SET_SESSION_WILL_EXPIRED:
      return {
        ...state,
        isWillExpired: action.payload,
      };

    case RESET_LOADING_STATE:
      state.loadingStates = [];

      return {
        ...state,
      };

    default:
      return state;
  }
}
