import {
  EventActionTypes,
  FETCH_EVENT_DEFINITIONS_ACTION,
  FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION,
  FETCH_EVENT_LOG_ENTRIES_ACTION,
  FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION,
  UPDATE_EVENT_DEFINITION_SUCCESS_ACTION,
} from './actions';
import { EventState } from './models';

const defaultState: EventState = {
  definitions: {},
  entries: [],
  results: [],
  nextEntries: null,
  isLoading: { definitions: false, log: false },
};

export default function (state: EventState = defaultState, action: EventActionTypes): EventState {
  switch (action.type) {
    case FETCH_EVENT_DEFINITIONS_ACTION:
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          definitions: true,
        },
      };
    case FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION:
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
    case UPDATE_EVENT_DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        definitions: {
          ...state.definitions,
          [`${action.definition.namespace}:${action.definition.name}`]: action.definition,
        },
      };
    case FETCH_EVENT_LOG_ENTRIES_ACTION:
      return {
        ...state,
        isLoading: { ...state.isLoading, log: true },
      };
    case FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION:
      return {
        ...state,
        entries: action.after ? [...state.entries, ...action.entries] : [...action.entries],
        nextEntries: action.next,
        isLoading: { ...state.isLoading, log: false },
      };
    default:
      return state;
  }
}
