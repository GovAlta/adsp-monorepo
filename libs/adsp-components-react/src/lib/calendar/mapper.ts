import { CalendarEvent, MapRecurrenceEvent } from '@abgov/adsp-components-core';
import { hasTimePart, toDuration, toLocalDateTime } from './calendarUtils';
import { END_OF_DAY_TIME } from './types';

export const mapRecurrentWeeklyEvent = (event: CalendarEvent): MapRecurrenceEvent => {
  return {
    title: event.name || event.description || event.recurrenceId?.toDateString() || 'Reocurring weekly event',
    editable: true,
    duration:
      toDuration(event.start, event.recurrence?.end?.until ? new Date(event.recurrence.end.until) : undefined) ??
      undefined,
    rrule: {
      freq: event.recurrence?.frequency,
      interval: event.recurrence?.interval,
      byweekday: event.recurrence?.daysOfWeek,
      dtstart: toLocalDateTime(event.start),
      until: hasTimePart(event.recurrence?.end?.until)
        ? event.recurrence?.end?.until
        : `${event.recurrence?.end?.until}T${END_OF_DAY_TIME}`,
    },
  };
};
export const mapRecurrentMonthlyEvent = (event: CalendarEvent): MapRecurrenceEvent => {
  return {
    title: event.name || event.description || event.recurrenceId?.toDateString() || 'Reocurring monthly event',
    editable: true,
    duration:
      toDuration(event.start, event.recurrence?.end?.until ? new Date(event.recurrence.end.until) : undefined) ??
      undefined,
    rrule: {
      freq: event.recurrence?.frequency,
      interval: event.recurrence?.interval,
      byweekday: event.recurrence?.daysOfWeek,
      dtstart: toLocalDateTime(event.start),
      until: hasTimePart(event.recurrence?.end?.until)
        ? event.recurrence?.end?.until
        : `${event.recurrence?.end?.until}T${END_OF_DAY_TIME}`,
    },
  };
};

export const mapRecurrentYearlyEvent = (event: CalendarEvent): MapRecurrenceEvent => {
  return {
    title: event.name || event.description || event.recurrenceId?.toDateString() || 'Reocurring yearly event',
    duration:
      toDuration(event.start, event.recurrence?.end?.until ? new Date(event.recurrence.end.until) : undefined) ??
      undefined,
    rrule: {
      freq: event.recurrence?.frequency,
      dtstart: toLocalDateTime(event.start),
      until: hasTimePart(event.recurrence?.end?.until)
        ? //If we dont have a time part for the date, we will set the time for the end of day
          event.recurrence?.end?.until
        : `${event.recurrence?.end?.until}T${END_OF_DAY_TIME}`,
    },
  };
};

// Entry point for mapping recurring events
export const mapRecurrenceEvent = (event: CalendarEvent): MapRecurrenceEvent | null => {
  if (event.recurrence?.frequency === 'weekly') return mapRecurrentWeeklyEvent(event);
  if (event.recurrence?.frequency === 'monthly') return mapRecurrentMonthlyEvent(event);
  if (event.recurrence?.frequency === 'yearly') return mapRecurrentYearlyEvent(event);

  return null;
};
