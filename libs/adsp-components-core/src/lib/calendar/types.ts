export interface DateRange {
  start?: Date;
  /** Exclusive end of the range. */
  end?: Date;
}

export interface CalendarEvent {
  id: number;
  name: string;
  description?: string;
  start: Date;
  /** Null for events with no end; treated as a point in time. */
  end: Date | null;
  isAllDay: boolean;
  isPublic: boolean;
  recordId?: string;
  context?: Record<string, unknown>;
}

export interface CalendarHoliday {
  /** Start of the holiday in the Alberta time zone. */
  date: Date;
  name: string;
  isInLieuOfDay: boolean;
}

export interface CalendarEvents {
  events: CalendarEvent[];
  holidays: CalendarHoliday[];
}

export interface ICalendarClient {
  getCalendarEvents(calendar: string, range: DateRange): Promise<CalendarEvents>;

  //Add additional methods as required.
}
