import { CalendarItem } from './models';

export const FETCH_CALENDARS_ACTION = 'calendar/FETCH_CALENDAR_ACTION';
export const FETCH_CALENDARS_SUCCESS_ACTION = 'calendar/FETCH_CALENDAR_SUCCESS_ACTION';

export const DELETE_CALENDAR_ACTION = 'calendar/DELETE_CALENDAR_ACTION';
export const DELETE_CALENDAR_SUCCESS_ACTION = 'calendar/DELETE_CALENDAR_ACTION_SUCCESS';

export const CREATE_CALENDAR_ACTION = 'calendar/CREATE_CALENDAR_ACTION';
export const CREATE_CALENDAR_SUCCESS_ACTION = 'calendar/CREATE_CALENDAR_ACTION_SUCCESS';

export const UPDATE_CALENDAR_ACTION = 'calendar/UPDATE_CALENDAR_ACTION';
export const UPDATE_CALENDAR_SUCCESS_ACTION = 'calendar/UPDATE_CALENDAR_SUCCESS_ACTION';

export interface FetchCalendarsAction {
  type: typeof FETCH_CALENDARS_ACTION;
}
export interface FetchCalendarsSuccessAction {
  type: typeof FETCH_CALENDARS_SUCCESS_ACTION;
  payload: { calendars: CalendarItem[] };
}

export interface UpdateCalendarAction {
  type: typeof UPDATE_CALENDAR_ACTION;
  payload: CalendarItem;
}
export interface UpdateCalendarSuccessAction {
  type: typeof UPDATE_CALENDAR_SUCCESS_ACTION;
  calendar: CalendarItem;
}

export interface DeleteCalendarAction {
  type: typeof DELETE_CALENDAR_ACTION;
  name: string;
}
export interface DeleteCalendarSuccessAction {
  type: typeof DELETE_CALENDAR_SUCCESS_ACTION;
}
export interface CreateCalendarAction {
  type: typeof CREATE_CALENDAR_ACTION;
  payload: CalendarItem;
}
export interface CreateCalendarSuccessAction {
  type: typeof CREATE_CALENDAR_SUCCESS_ACTION;
  payload: {
    calendar: CalendarItem;
  };
}
export type ActionTypes =
  | FetchCalendarsAction
  | FetchCalendarsSuccessAction
  | UpdateCalendarAction
  | UpdateCalendarSuccessAction
  | DeleteCalendarAction
  | DeleteCalendarSuccessAction
  | CreateCalendarAction
  | CreateCalendarSuccessAction;

export const fetchCalendars = (): FetchCalendarsAction => ({
  type: FETCH_CALENDARS_ACTION,
});

export const fetchCalendarSuccess = (calendars: CalendarItem[]): FetchCalendarsSuccessAction => ({
  type: FETCH_CALENDARS_SUCCESS_ACTION,
  payload: { calendars: calendars },
});

export const UpdateCalendar = (payload: CalendarItem): UpdateCalendarAction => ({
  type: UPDATE_CALENDAR_ACTION,
  payload,
});

export const UpdateCalendarSuccess = (calendar: CalendarItem): UpdateCalendarSuccessAction => ({
  type: UPDATE_CALENDAR_SUCCESS_ACTION,
  calendar: calendar,
});

export const DeleteCalendar = (name: string): DeleteCalendarAction => ({
  type: DELETE_CALENDAR_ACTION,
  name: name,
});

export const DeleteCalendarSuccess = (): DeleteCalendarSuccessAction => ({
  type: DELETE_CALENDAR_SUCCESS_ACTION,
});

export const CreateCalendar = (payload: CalendarItem): CreateCalendarAction => ({
  type: CREATE_CALENDAR_ACTION,
  payload: payload,
});

export const CreateCalendarSuccess = (calendar: CalendarItem): CreateCalendarSuccessAction => ({
  type: CREATE_CALENDAR_SUCCESS_ACTION,
  payload: { calendar },
});
