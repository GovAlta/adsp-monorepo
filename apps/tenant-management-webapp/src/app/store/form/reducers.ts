import {
  FETCH_FORM_DEFINITIONS_SUCCESS_ACTION,
  UPDATE_FORM_DEFINITION_SUCCESS_ACTION,
  DELETE_FORM_DEFINITION_SUCCESS_ACTION,
  FormActionTypes,
  DELETE_FORM_BY_ID_ACTION,
  CLEAR_FORM_DEFINITIONS_ACTION,
} from './action';

import { FormState } from './model';

export const defaultState: FormState = {
  definitions: [],
  nextEntries: null,
};

export default function (state: FormState = defaultState, action: FormActionTypes): FormState {
  switch (action.type) {
    case CLEAR_FORM_DEFINITIONS_ACTION:
      return {
        ...state,
        definitions: [],
      };

    case FETCH_FORM_DEFINITIONS_SUCCESS_ACTION:
      return {
        ...state,
        definitions:
          action.after && action.after !== ''
            ? { ...state.definitions, ...action.payload }
            : action.payload
            ? action.payload
            : state.definitions,
        nextEntries: action.next,
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
