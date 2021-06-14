import { EventLogActionTypes, FETCH_EVENT_LOG_ENTRIES_ACTION, FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION } from './actions';
import { EventLogState } from './models';

const initialState: EventLogState = {
  entries: [],
  next: null,
  isLoading: false,
};

export default function (state: EventLogState = initialState, action: EventLogActionTypes): EventLogState {
  switch (action.type) {
    case FETCH_EVENT_LOG_ENTRIES_ACTION:
      return {
        ...state,
        isLoading: true,
      };
    case FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION:
      return {
        ...state,
        entries: action.after ? [...state.entries, ...action.entries] : [...action.entries],
        next: action.next,
        isLoading: false,
      };
    default:
      return state;
  }
}
