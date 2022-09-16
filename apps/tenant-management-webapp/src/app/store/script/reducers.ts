import { ActionTypes, UPDATE_SCRIPT_SUCCESS_ACTION, FETCH_SCRIPTS_SUCCESS_ACTION, UPDATE_INDICATOR } from './actions';
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
