import { UISchemaElement } from '@jsonforms/core';
import {
  FETCH_FORM_DEFINITIONS_SUCCESS_ACTION,
  UPDATE_FORM_DEFINITION_ACTION,
  UPDATE_FORM_DEFINITION_SUCCESS_ACTION,
  DELETE_FORM_DEFINITION_SUCCESS_ACTION,
  FormActionTypes,
  DELETE_FORM_BY_ID_ACTION,
  CLEAR_FORM_DEFINITIONS_ACTION,
  OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION,
  SET_DRAFT_DATA_SCHEMA_ACTION,
  SET_DRAFT_UI_SCHEMA_ACTION,
  OPEN_EDITOR_FOR_DEFINITION_ACTION,
  PROCESS_DATA_SCHEMA_SUCCESS_ACTION,
  PROCESS_UI_SCHEMA_SUCCESS_ACTION,
  PROCESS_DATA_SCHEMA_FAILED_ACTION,
  PROCESS_UI_SCHEMA_FAILED_ACTION,
  UPDATE_EDITOR_FORM_DEFINITION_ACTION,
  CLOSE_EDITOR_ACTION,
  OPEN_EDITOR_FOR_DEFINITION_FAILED_ACTION,
} from './action';

import { FormState } from './model';

export const defaultState: FormState = {
  definitions: {},
  nextEntries: null,
  editor: {
    selectedId: null,
    loading: false,
    saving: false,
    original: null,
    modified: null,
    dataSchemaDraft: '',
    uiSchemaDraft: '',
    dataSchema: {},
    uiSchema: {} as UISchemaElement,
  },
};

export default function (state: FormState = defaultState, action: FormActionTypes): FormState {
  switch (action.type) {
    case CLEAR_FORM_DEFINITIONS_ACTION:
      return {
        ...state,
        definitions: {},
      };

    case FETCH_FORM_DEFINITIONS_SUCCESS_ACTION:
      return {
        ...state,
        definitions: action.after
          ? { ...state.definitions, ...action.payload }
          : action.payload
          ? action.payload
          : state.definitions,
        nextEntries: action.next,
      };

    case UPDATE_FORM_DEFINITION_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          saving: state.editor.selectedId === action.definition.id ? true : state.editor.saving,
        },
      };

    case UPDATE_FORM_DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        definitions: {
          ...state.definitions,
          [action.payload.id]: action.payload,
        },
        editor: {
          ...state.editor,
          saving: state.editor.selectedId === action.payload.id ? false : state.editor.saving,
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

    case DELETE_FORM_DEFINITION_SUCCESS_ACTION: {
      const result = {
        ...state,
      };

      delete result.definitions[action.payload.id];
      return result;
    }

    case OPEN_EDITOR_FOR_DEFINITION_ACTION:
      return {
        ...state,
        editor: {
          ...defaultState.editor,
          selectedId: action.id,
          loading: true,
        },
      };

    case OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION: {
      const { dataSchema, uiSchema, ...definition } = action.definition;
      return {
        ...state,
        editor: {
          selectedId: action.definition.id,
          loading: false,
          saving: false,
          original: action.definition,
          modified: definition,
          dataSchema: dataSchema || {},
          uiSchema: uiSchema as unknown as UISchemaElement,
          dataSchemaDraft: JSON.stringify(dataSchema, null, 2),
          uiSchemaDraft: JSON.stringify(uiSchema, null, 2),
        },
      };
    }

    case OPEN_EDITOR_FOR_DEFINITION_FAILED_ACTION:
      return {
        ...state,
        editor: {
          ...defaultState.editor,
          loading: false,
        },
      };

    case UPDATE_EDITOR_FORM_DEFINITION_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          modified: {
            ...state.editor.modified,
            ...action.update,
          },
        },
      };

    case SET_DRAFT_DATA_SCHEMA_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          dataSchemaDraft: action.draft,
        },
      };

    case SET_DRAFT_UI_SCHEMA_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          uiSchemaDraft: action.draft,
        },
      };

    case PROCESS_DATA_SCHEMA_SUCCESS_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          dataSchema: action.schema,
          dataSchemaError: null,
        },
      };

    case PROCESS_UI_SCHEMA_SUCCESS_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          uiSchema: action.schema,
          uiSchemaError: null,
        },
      };

    case PROCESS_DATA_SCHEMA_FAILED_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          dataSchemaError: action.error,
        },
      };

    case PROCESS_UI_SCHEMA_FAILED_ACTION:
      return {
        ...state,
        editor: {
          ...state.editor,
          uiSchemaError: action.error,
        },
      };

    case CLOSE_EDITOR_ACTION:
      return {
        ...state,
        editor: {
          ...defaultState.editor,
        },
      };

    default:
      return state;
  }
}
