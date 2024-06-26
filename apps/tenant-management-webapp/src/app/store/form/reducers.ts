import {
  FETCH_FORM_DEFINITIONS_SUCCESS_ACTION,
  UPDATE_FORM_DEFINITION_SUCCESS_ACTION,
  DELETE_FORM_DEFINITION_SUCCESS_ACTION,
  FormActionTypes,
  DELETE_FORM_BY_ID_ACTION,
} from './action';

import { FormState } from './model';

export const defaultState: FormState = {
  definitions: {},
};

export default function (state: FormState = defaultState, action: FormActionTypes): FormState {
  switch (action.type) {
    case FETCH_FORM_DEFINITIONS_SUCCESS_ACTION:
      return {
        ...state,
        definitions: action.payload,
      };

    case UPDATE_FORM_DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        definitions: {
          ...action.payload,
        },
      };

    case DELETE_FORM_BY_ID_ACTION: {
      const id = action?.id;

      if (id in state.definitions) {
        delete state.definitions[id];
      }

      return {
        ...state,
      };
    }

    case DELETE_FORM_DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        definitions: {
          ...action.payload,
        },
      };

    default:
      return state;
  }
}
