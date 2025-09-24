import { CalendarItem, Indicator, CalendarEvent, CalendarEventSearchCriteria } from './models';

export const FETCH_CALENDARS_ACTION = 'calendar/FETCH_CALENDAR_ACTION';
export const FETCH_CALENDARS_SUCCESS_ACTION = 'calendar/FETCH_CALENDAR_SUCCESS_ACTION';

export const DELETE_CALENDAR_EVENT_ACTION = 'calendar/event/delete';
export const DELETE_CALENDAR_EVENT_SUCCESS_ACTION = 'calendar/event/delete/success';

export const UPDATE_INDICATOR = 'calendar/indicator';
export const FETCH_EVENTS_BY_CALENDAR_ACTION = 'calendar/events/fetch/calendar-name';
export const FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION = 'calendar/events/fetch/calendar-name/success';

export const CREATE_EVENT_CALENDAR_ACTION = 'calendar/CREATE_EVENT_CALENDAR_ACTION';
export const CREATE_EVENT_CALENDAR_SUCCESS_ACTION = 'calendar/CREATE_EVENT_CALENDAR_SUCCESS_ACTION';

export const UPDATE_EVENT_CALENDAR_ACTION = 'calendar/UPDATE_EVENT_CALENDAR_ACTION';
export const UPDATE_EVENT_CALENDAR_SUCCESS_ACTION = 'calendar/UPDATE_EVENT_CALENDAR_SUCCESS_ACTION';
export const UPDATE_EVENT_SEARCH_CRITERIA_ACTION = 'calendar/event/search/criteria/update';

export const UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION = 'calendar/event/search/criteria/update/event/fetch';

export const EXPORT_EVENT_CALENDAR_ACTION = 'calendar/event/export';
export const EXPORT_EVENT_CALENDAR_SUCCESS_ACTION = 'calendar/event/export/success';

export interface FetchCalendarsAction {
  type: typeof FETCH_CALENDARS_ACTION;
}
export interface FetchCalendarsSuccessAction {
  type: typeof FETCH_CALENDARS_SUCCESS_ACTION;
  payload: { tenant: Record<string, CalendarItem>; core: Record<string, CalendarItem> };
}

export interface DeleteCalendarEventAction {
  type: typeof DELETE_CALENDAR_EVENT_ACTION;
  eventId: string;
  calendarName: string;
}
export interface DeleteCalendarEventSuccessAction {
  type: typeof DELETE_CALENDAR_EVENT_SUCCESS_ACTION;
  eventId: string;
  calendarName: string;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}

export interface FetchEventsByCalendarAction {
  type: typeof FETCH_EVENTS_BY_CALENDAR_ACTION;
  payload: string;
  after: string;
  criteria?: CalendarEventSearchCriteria;
}

export interface FetchEventsByCalendarSuccessAction {
  type: typeof FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION;
  payload: CalendarEvent[];
  calendarName: string;
  nextEvents: string;
  after?: string;
}

export interface CreateEventsByCalendarAction {
  type: typeof CREATE_EVENT_CALENDAR_ACTION;
  payload: CalendarEvent;
  calendarName: string;
}

export interface CreateEventsByCalendarSuccessAction {
  type: typeof CREATE_EVENT_CALENDAR_SUCCESS_ACTION;
  payload: CalendarEvent;
  calendarName: string;
}

export interface UpdateEventsByCalendarAction {
  type: typeof UPDATE_EVENT_CALENDAR_ACTION;
  payload: CalendarEvent;
  calendarName: string;
  eventId: string;
}

export interface UpdateEventsByCalendarSuccessAction {
  type: typeof UPDATE_EVENT_CALENDAR_SUCCESS_ACTION;
  payload: CalendarEvent;
  calendarName: string;
  eventId: string;
}

export interface UpdateSearchCalendarEventCriteriaAction {
  type: typeof UPDATE_EVENT_SEARCH_CRITERIA_ACTION;
  payload?: CalendarEventSearchCriteria;
}

export interface UpdateSearchCalendarEventCriteriaAndFetchEventsAction {
  type: typeof UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION;
  payload?: CalendarEventSearchCriteria;
}

export interface CalendarEventExportAction {
  type: typeof EXPORT_EVENT_CALENDAR_ACTION;
  calendarName: string;
  top: number;
}

export interface CalendarEventExportSuccessAction {
  type: typeof EXPORT_EVENT_CALENDAR_SUCCESS_ACTION;
  payload: string | null;
}

export type ActionTypes =
  | FetchCalendarsAction
  | FetchCalendarsSuccessAction
  // | UpdateCalendarAction
  // | UpdateCalendarSuccessAction
  // | DeleteCalendarAction
  // | DeleteCalendarSuccessAction
  | UpdateIndicatorAction
  | FetchEventsByCalendarAction
  | FetchEventsByCalendarSuccessAction
  | CreateEventsByCalendarAction
  | CreateEventsByCalendarSuccessAction
  | DeleteCalendarEventAction
  | DeleteCalendarEventSuccessAction
  | UpdateEventsByCalendarAction
  | UpdateSearchCalendarEventCriteriaAction
  | UpdateSearchCalendarEventCriteriaAndFetchEventsAction
  | UpdateEventsByCalendarSuccessAction
  | CalendarEventExportAction
  | CalendarEventExportSuccessAction;

export const fetchCalendars = (): FetchCalendarsAction => ({
  type: FETCH_CALENDARS_ACTION,
});

export const fetchCalendarSuccess = (calendars: {
  tenant: Record<string, CalendarItem>;
  core: Record<string, CalendarItem>;
}): FetchCalendarsSuccessAction => ({
  type: FETCH_CALENDARS_SUCCESS_ACTION,
  payload: calendars,
});

export const FetchEventsByCalendar = (calendarId: string, after?: string): FetchEventsByCalendarAction => ({
  type: FETCH_EVENTS_BY_CALENDAR_ACTION,
  payload: calendarId,
  after,
});

export const FetchEventsByCalendarSuccess = (
  event: CalendarEvent[],
  calendarName: string,
  nextEvents: string,
  after: string
): FetchEventsByCalendarSuccessAction => ({
  type: FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION,
  payload: event,
  calendarName,
  nextEvents,
  after,
});
export const CreateEventsByCalendar = (calendarName: string, event: CalendarEvent): CreateEventsByCalendarAction => ({
  type: CREATE_EVENT_CALENDAR_ACTION,
  payload: event,
  calendarName,
});

export const CreateEventsByCalendarSuccess = (
  calendarName: string,
  event: CalendarEvent
): CreateEventsByCalendarSuccessAction => ({
  type: CREATE_EVENT_CALENDAR_SUCCESS_ACTION,
  payload: event,
  calendarName,
});

export const DeleteCalendarEvent = (eventId: string, calendarName: string): DeleteCalendarEventAction => ({
  type: DELETE_CALENDAR_EVENT_ACTION,
  eventId,
  calendarName,
});

export const DeleteCalendarEventSuccess = (
  eventId: string,
  calendarName: string
): DeleteCalendarEventSuccessAction => ({
  type: DELETE_CALENDAR_EVENT_SUCCESS_ACTION,
  eventId,
  calendarName,
});
export const UpdateEventsByCalendar = (
  calendarName: string,
  eventId: string,
  event: CalendarEvent
): UpdateEventsByCalendarAction => ({
  type: UPDATE_EVENT_CALENDAR_ACTION,
  payload: event,
  calendarName,
  eventId,
});

export const UpdateEventsByCalendarSuccess = (
  calendarName: string,
  eventId: string,
  event: CalendarEvent
): UpdateEventsByCalendarSuccessAction => ({
  type: UPDATE_EVENT_CALENDAR_SUCCESS_ACTION,
  payload: event,
  calendarName,
  eventId,
});

export const UpdateSearchCalendarEventCriteria = (
  criteria?: CalendarEventSearchCriteria
): UpdateSearchCalendarEventCriteriaAction => ({
  type: UPDATE_EVENT_SEARCH_CRITERIA_ACTION,
  payload: criteria,
});

export const UpdateSearchCriteriaAndFetchEvents = (
  criteria?: CalendarEventSearchCriteria
): UpdateSearchCalendarEventCriteriaAndFetchEventsAction => ({
  type: UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION,
  payload: criteria,
});