export interface CalendarItem {
  id?: string;
  name: string;
  displayName?: string;
  description?: string;
  readRoles: string[];
  updateRoles: string[];
}
export interface CalendarService {
  calendars: Array<CalendarItem>;
}
export const defaultCalendar: CalendarItem = {
  id: '',
  name: '',
  displayName: '',
  description: '',
  readRoles: [],
  updateRoles: [],
};
export const CALENDAR_INIT: CalendarService = {
  calendars: null,
};
