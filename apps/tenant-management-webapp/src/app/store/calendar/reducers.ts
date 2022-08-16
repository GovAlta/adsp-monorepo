import {
  ActionTypes,
  FETCH_CALENDARS_SUCCESS_ACTION,
  DELETE_CALENDAR_SUCCESS_ACTION,
  UPDATE_CALENDAR_SUCCESS_ACTION,
  CREATE_CALENDAR_SUCCESS_ACTION,
  UPDATE_INDICATOR,
} from './actions';
import { CalendarService, CALENDAR_INIT } from './models';

export default (state = CALENDAR_INIT, action: ActionTypes): CalendarService => {
  switch (action.type) {
    case FETCH_CALENDARS_SUCCESS_ACTION: {
      return { ...state, calendars: action.payload.calendars };
    }
    case DELETE_CALENDAR_SUCCESS_ACTION: {
      return { ...state };
    }
    case UPDATE_CALENDAR_SUCCESS_ACTION: {
      return { ...state };
    }
    case CREATE_CALENDAR_SUCCESS_ACTION: {
      const calendars = state.calendars;
      calendars.push(action.payload.calendar);
      return { ...state, calendars: calendars };
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
