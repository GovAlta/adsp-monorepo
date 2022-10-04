import {
  ActionTypes,
  UPDATE_SCRIPT_SUCCESS_ACTION,
  FETCH_SCRIPTS_SUCCESS_ACTION,
  UPDATE_INDICATOR,
  DELETE_SCRIPT_SUCCESS_ACTION,
  RUN_SCRIPT_ACTION_SUCCESS,
} from './actions';
import { ScriptService, SCRIPT_INIT } from './models';

export default (state = SCRIPT_INIT, action: ActionTypes): ScriptService => {
  console.log(JSON.stringify(action.type) + '<action.ptye');
  switch (action.type) {
    case UPDATE_SCRIPT_SUCCESS_ACTION: {
      console.log(JSON.stringify(action.payload) + '<update payload');
      return {
        ...state,
        scripts: {
          ...action.payload,
        },
      };
    }
    case FETCH_SCRIPTS_SUCCESS_ACTION: {
      console.log(JSON.stringify(action.payload) + '<success payload');
      return {
        ...state,
        scripts: {
          ...action.payload,
        },
      };
    }
    case RUN_SCRIPT_ACTION_SUCCESS: {
      const newStringResponses = state.scriptResponse || [];
      console.log(JSON.stringify(action.payload) + '<newStringResponses');
      console.log(JSON.stringify(newStringResponses) + '<newStringResponses');
      newStringResponses.push(action.payload);
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
    default:
      return state;
  }
};
