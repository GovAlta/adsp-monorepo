import { AdspComponentThemeOverrides, CalendarView, DateRange, ICalendarClient } from '@abgov/adsp-components-core';

// Maps the public, framework-independent CalendarView to FullCalendar's own view names.
export const FULL_CALENDAR_VIEW: Record<CalendarView, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
  list: 'listWeek',
};

export const VIEW_BUTTON_LABEL: Record<string, string> = {
  dayGridMonth: 'Month',
  timeGridWeek: 'Week',
  timeGridDay: 'Day',
  listWeek: 'List',
};

//Views a calendar component can display; kept framework-independent so React, Angular and Vue adapters share it.
export interface AdspGoACalendarProps {
  /** Loads events and holidays for the calendar; create it once or memoize it so it's stable across renders. */
  client: ICalendarClient;

  /**
   * The calendar name
   */
  calendar: string;

  /**
   * The default view we want to display
   */
  defaultView?: CalendarView;

  themeOverrides?: AdspComponentThemeOverrides<'calendar'>;

  /** The date range to load events for initially, and the date the calendar opens on; defaults to the past 365 days. */
  initialDateRange?: DateRange;

  /**
   * The test id for calendar component
   */
  testId?: string;
}

export const DEFAULT_RANGE_DAYS = 365;
export const END_OF_DAY_TIME = '23:59:59.000-06:00';
