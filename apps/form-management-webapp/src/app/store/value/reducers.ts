import {
  DELETE_VALUE_DEFINITION_SUCCESS_ACTION,
  ValueActionTypes,
  FETCH_VALUE_DEFINITIONS_ACTION,
  FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION,
  FETCH_VALUE_LOG_ENTRIES_ACTION,
  FETCH_VALUE_LOG_ENTRIES_SUCCESS_ACTION,
  UPDATE_VALUE_DEFINITION_SUCCESS_ACTION,
  CLEAR_VALUE_LOG_ENTRIES_SUCCESS_ACTION,
  FETCH_VALUE_METRICS_SUCCESS_ACTION,
} from './actions';
import { ValueState } from './models';

const defaultState: ValueState = {
  definitions: {},
  entries: null,
  results: [],
  nextEntries: null,
  metrics: {},
  isLoading: { definitions: false, log: false },
};

export default function (state: ValueState = defaultState, action: ValueActionTypes): ValueState {
  switch (action.type) {
    case FETCH_VALUE_DEFINITIONS_ACTION:
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          definitions: true,
        },
      };
    case FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION:
      return {
        ...state,
        definitions: action.results.reduce(
          (defs, result) => ({ ...defs, [`${result.namespace}:${result.name}`]: result }),
          state.definitions
        ),
        results: action.results.map((result) => `${result.namespace}:${result.name}`),
        isLoading: {
          ...state.isLoading,
          definitions: false,
        },
      };
    case UPDATE_VALUE_DEFINITION_SUCCESS_ACTION: {
      const key = `${action.definition.namespace}:${action.definition.name}`;
      const newState = {
        ...state,
        definitions: {
          ...state.definitions,
          [key]: action.definition,
        },
      };

      if (!newState.results.includes(key)) {
        newState.results.splice(0, 0, key);
      }

      return newState;
    }
    case DELETE_VALUE_DEFINITION_SUCCESS_ACTION: {
      const key = `${action.definition.namespace}:${action.definition.name}`;
      const newState = { ...state };
      delete newState.definitions[key];
      newState.results = newState.results.filter((r) => r !== key);

      return newState;
    }
    case FETCH_VALUE_LOG_ENTRIES_ACTION:
      return {
        ...state,
        isLoading: { ...state.isLoading, log: true },
      };
    case FETCH_VALUE_LOG_ENTRIES_SUCCESS_ACTION:
      return {
        ...state,
        entries: action.after ? [...state.entries, ...action.entries] : [...action.entries],
        nextEntries: action.next,
        isLoading: { ...state.isLoading, log: false },
      };
    case CLEAR_VALUE_LOG_ENTRIES_SUCCESS_ACTION:
      return {
        ...state,
        entries: null,
        nextEntries: null,
        isLoading: { ...state.isLoading, log: true },
      };
    case FETCH_VALUE_METRICS_SUCCESS_ACTION:
      return {
        ...state,
        metrics: action.metrics,
      };
    default:
      return state;
  }
}
