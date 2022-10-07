import {
  ActionTypes,
  UPDATE_SCRIPT_SUCCESS_ACTION,
  FETCH_SCRIPTS_SUCCESS_ACTION,
  UPDATE_INDICATOR,
  DELETE_SCRIPT_SUCCESS_ACTION,
  RUN_SCRIPT_ACTION_SUCCESS,
  CLEAR_SCRIPTS_ACTION,
} from './actions';
import { ScriptService, SCRIPT_INIT } from './models';

export default (state = SCRIPT_INIT, action: ActionTypes): ScriptService => {
  switch (action.type) {
    case UPDATE_SCRIPT_SUCCESS_ACTION: {
      return {
        ...state,
        scripts: {
          ...action.payload,
        },
      };
    }
    case FETCH_SCRIPTS_SUCCESS_ACTION: {
      return {
        ...state,
        scripts: {
          ...action.payload,
        },
      };
    }
    case RUN_SCRIPT_ACTION_SUCCESS: {
      const newStringResponses = state.scriptResponse || [];
      newStringResponses.unshift(action.payload);
      return { ...state, scriptResponse: newStringResponses };
    }
    case DELETE_SCRIPT_SUCCESS_ACTION: {
      const deletedScript = Object.keys(state.scripts).find((scriptName) => scriptName === action.scriptId);

      delete state.scripts[deletedScript];
      return { ...state, scripts: { ...state.scripts } };
    }
    case UPDATE_INDICATOR: {
      state.indicator = {
        details: {
          ...state.indicator.details,
          ...action.payload?.details,
        },
      };
      return {
        ...state,
      };
    }
    case CLEAR_SCRIPTS_ACTION: {
      return {
        ...state,
        scriptResponse: null,
      };
    }
    default:
      return state;
  }
};
