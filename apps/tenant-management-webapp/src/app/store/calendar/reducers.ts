import {
  ActionTypes,
  FETCH_CALENDARS_SUCCESS_ACTION,
  DELETE_CALENDAR_SUCCESS_ACTION,
  UPDATE_CALENDAR_SUCCESS_ACTION,
  UPDATE_INDICATOR,
  FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION,
  CREATE_EVENT_CALENDAR_SUCCESS_ACTION,
  DELETE_CALENDAR_EVENT_SUCCESS_ACTION,
  UPDATE_EVENT_CALENDAR_SUCCESS_ACTION,
  UPDATE_EVENT_SEARCH_CRITERIA_ACTION,
} from './actions';
import { CalendarService, CALENDAR_INIT, getDefaultSearchCriteria } from './models';

export default (state = CALENDAR_INIT, action: ActionTypes): CalendarService => {
  switch (action.type) {
    case FETCH_CALENDARS_SUCCESS_ACTION: {
      return { ...state, calendars: action.payload };
    }
    case DELETE_CALENDAR_SUCCESS_ACTION: {
      const deletedCalendar = Object.keys(state.calendars).find((calendarName) => calendarName === action.calendarId);

      delete state.calendars[deletedCalendar];
      return { ...state, calendars: { ...state.calendars } };
    }
    case UPDATE_CALENDAR_SUCCESS_ACTION: {
      return {
        ...state,
        calendars: {
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
    case CREATE_EVENT_CALENDAR_SUCCESS_ACTION: {
      state.calendars[action.calendarName].selectedCalendarEvents.push(action.payload);
      return {
        ...state,
      };
    }
    case UPDATE_EVENT_CALENDAR_SUCCESS_ACTION: {
      const eventIndex = state.calendars[action.calendarName].selectedCalendarEvents.findIndex(
        (event) => event.id.toString() === action.eventId
      );
      state.calendars[action.calendarName].selectedCalendarEvents[eventIndex] = action.payload;
      return {
        ...state,
      };
    }
    case FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION: {
      const events = action.payload;
      const name = action.calendarName;
      if (!action.after) {
        state.calendars[name].selectedCalendarEvents = events;
        state.calendars[name].nextEvents = action.nextEvents;
        return {
          ...state,
        };
      }

      if (!state.calendars[name]?.selectedCalendarEvents) {
        state.calendars[name].selectedCalendarEvents = [];
      }
      const eventIds = state.calendars[name]?.selectedCalendarEvents.map((e) => e.id);
      for (const event of events) {
        if (!(event?.id in eventIds)) {
          state.calendars[name].selectedCalendarEvents.push(event);
        }
      }

      state.calendars[name].nextEvents = action.nextEvents;
      return {
        ...state,
      };
    }

    case UPDATE_EVENT_SEARCH_CRITERIA_ACTION: {
      // Does not have the criteria, return the default value
      if (!action.payload) {
        state.eventSearchCriteria = getDefaultSearchCriteria();
        return { ...state };
      }
      state.eventSearchCriteria = action.payload;
      return {
        ...state,
      };
    }

    case DELETE_CALENDAR_EVENT_SUCCESS_ACTION: {
      const calendarName = action.calendarName;
      const eventId = Number(action.eventId);
      state.calendars[calendarName].selectedCalendarEvents = state.calendars[
        calendarName
      ].selectedCalendarEvents.filter((e) => e.id !== eventId);
      return {
        ...state,
      };
    }

    default:
      return state;
  }
};
