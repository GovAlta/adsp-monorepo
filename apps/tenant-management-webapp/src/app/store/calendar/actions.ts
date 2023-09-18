import { CalendarItem, Indicator, CalendarEvent } from './models';

export const FETCH_CALENDARS_ACTION = 'calendar/FETCH_CALENDAR_ACTION';
export const FETCH_CALENDARS_SUCCESS_ACTION = 'calendar/FETCH_CALENDAR_SUCCESS_ACTION';

export const DELETE_CALENDAR_ACTION = 'calendar/DELETE_CALENDAR_ACTION';
export const DELETE_CALENDAR_SUCCESS_ACTION = 'calendar/DELETE_CALENDAR_ACTION_SUCCESS';

export const UPDATE_CALENDAR_ACTION = 'calendar/UPDATE_CALENDAR_ACTION';
export const UPDATE_CALENDAR_SUCCESS_ACTION = 'calendar/UPDATE_CALENDAR_SUCCESS_ACTION';

export const UPDATE_INDICATOR = 'calendar/indicator';
export const FETCH_EVENTS_BY_CALENDAR_ACTION = 'calendar/events/fetch/calendar-name';
export const FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION = 'calendar/events/fetch/calendar-name/success';

export interface FetchCalendarsAction {
  type: typeof FETCH_CALENDARS_ACTION;
}
export interface FetchCalendarsSuccessAction {
  type: typeof FETCH_CALENDARS_SUCCESS_ACTION;
  payload: Record<string, CalendarItem>;
}

export interface UpdateCalendarAction {
  type: typeof UPDATE_CALENDAR_ACTION;
  payload: CalendarItem;
}
export interface UpdateCalendarSuccessAction {
  type: typeof UPDATE_CALENDAR_SUCCESS_ACTION;
  payload: Record<string, CalendarItem>;
}

export interface DeleteCalendarAction {
  type: typeof DELETE_CALENDAR_ACTION;
  calendarId: string;
}
export interface DeleteCalendarSuccessAction {
  type: typeof DELETE_CALENDAR_SUCCESS_ACTION;
  calendarId: string;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}

export interface FetchEventsByCalendarAction {
  type: typeof FETCH_EVENTS_BY_CALENDAR_ACTION;
  payload: string;
}

export interface FetchEventsByCalendarSuccessAction {
  type: typeof FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION;
  payload: CalendarEvent[];
}

export type ActionTypes =
  | FetchCalendarsAction
  | FetchCalendarsSuccessAction
  | UpdateCalendarAction
  | UpdateCalendarSuccessAction
  | DeleteCalendarAction
  | DeleteCalendarSuccessAction
  | UpdateIndicatorAction
  | FetchEventsByCalendarAction
  | FetchEventsByCalendarSuccessAction;

export const fetchCalendars = (): FetchCalendarsAction => ({
  type: FETCH_CALENDARS_ACTION,
});

export const fetchCalendarSuccess = (calendars: Record<string, CalendarItem>): FetchCalendarsSuccessAction => ({
  type: FETCH_CALENDARS_SUCCESS_ACTION,
  payload: calendars,
});

export const UpdateCalendar = (payload: CalendarItem): UpdateCalendarAction => ({
  type: UPDATE_CALENDAR_ACTION,
  payload,
});

export const UpdateCalendarSuccess = (calendar: Record<string, CalendarItem>): UpdateCalendarSuccessAction => ({
  type: UPDATE_CALENDAR_SUCCESS_ACTION,
  payload: calendar,
});

export const DeleteCalendar = (calendarId: string): DeleteCalendarAction => ({
  type: DELETE_CALENDAR_ACTION,
  calendarId: calendarId,
});

export const DeleteCalendarSuccess = (calendarId: string): DeleteCalendarSuccessAction => ({
  type: DELETE_CALENDAR_SUCCESS_ACTION,
  calendarId: calendarId,
});

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});

export const FetchEventsByCalendar = (calendarId: string): FetchEventsByCalendarAction => ({
  type: FETCH_EVENTS_BY_CALENDAR_ACTION,
  payload: calendarId,
});

export const FetchEventsByCalendarSuccess = (event: CalendarEvent[]): FetchEventsByCalendarSuccessAction => ({
  type: FETCH_EVENTS_BY_CALENDAR_SUCCESS_ACTION,
  payload: event,
});
