import { CalendarItem, Indicator } from './models';

export const FETCH_CALENDARS_ACTION = 'calendar/FETCH_CALENDAR_ACTION';
export const FETCH_CALENDARS_SUCCESS_ACTION = 'calendar/FETCH_CALENDAR_SUCCESS_ACTION';

export const DELETE_CALENDAR_ACTION = 'calendar/DELETE_CALENDAR_ACTION';
export const DELETE_CALENDAR_SUCCESS_ACTION = 'calendar/DELETE_CALENDAR_ACTION_SUCCESS';

export const UPDATE_CALENDAR_ACTION = 'calendar/UPDATE_CALENDAR_ACTION';
export const UPDATE_CALENDAR_SUCCESS_ACTION = 'calendar/UPDATE_CALENDAR_SUCCESS_ACTION';

export const UPDATE_INDICATOR = 'calendar/indicator';

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
  name: string;
}
export interface DeleteCalendarSuccessAction {
  type: typeof DELETE_CALENDAR_SUCCESS_ACTION;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}

export type ActionTypes =
  | FetchCalendarsAction
  | FetchCalendarsSuccessAction
  | UpdateCalendarAction
  | UpdateCalendarSuccessAction
  | DeleteCalendarAction
  | DeleteCalendarSuccessAction
  | UpdateIndicatorAction;

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

export const DeleteCalendar = (name: string): DeleteCalendarAction => ({
  type: DELETE_CALENDAR_ACTION,
  name: name,
});

export const DeleteCalendarSuccess = (): DeleteCalendarSuccessAction => ({
  type: DELETE_CALENDAR_SUCCESS_ACTION,
});

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});
