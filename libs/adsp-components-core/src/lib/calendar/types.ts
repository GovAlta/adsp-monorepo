export interface DateRange {
  start?: Date;
  /** Exclusive end of the range. */
  end?: Date;
}

// Views a calendar component can display; kept framework-independent so React, Angular and Vue adapters share it.
export type CalendarView = 'month' | 'week' | 'day' | 'list';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceDay = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface RecurrenceEvent {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: RecurrenceDay[];
  end?: { until?: string; count?: number };
}

export interface CalendarEvent {
  /** For an occurrence of a recurring event, the id of the recurring event. */
  id: number;

  /**The name of the calendar to display on a cell */
  name: string;
  /** The description of the calendar */
  description?: string;
  start: Date;
  /** Null for events with no end; treated as a point in time. */
  end: Date | null;
  isAllDay: boolean;
  isPublic: boolean;
  recordId?: string;
  context?: Record<string, unknown>;
  /** Original start of an occurrence of a recurring event; unique per occurrence together with id. */
  recurrenceId?: Date;
  recurrence?: RecurrenceEvent;
}

export interface CalendarHoliday {
  /** Start of the holiday in the Alberta time zone. */
  date: Date;
  /** Alberta calendar day as yyyy-MM-dd; displays on the correct day regardless of the browser's time zone. */
  day: string;
  name: string;
  isInLieuOfDay: boolean;
}

export interface CalendarEvents {
  events: CalendarEvent[];
  holidays: CalendarHoliday[];
}

export interface ICalendarClient {
  getCalendarRange(calendar: string, range: DateRange): Promise<CalendarEvents>;

  //Add additional methods as required.
}
