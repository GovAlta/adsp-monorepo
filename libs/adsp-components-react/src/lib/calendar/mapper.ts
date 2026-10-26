import { CalendarEvent, MapRecurrenceEvent } from '@abgov/adsp-components-core';
import { hasTimePart, toLocalDateTime } from './calendarUtils';
import { END_OF_DAY_TIME } from './types';

// An open-ended recurrence has no until; returning undefined avoids an invalid rrule string.
const toUntil = (until: string | undefined): string | undefined =>
  !until ? undefined : hasTimePart(until) ? until : `${until}T${END_OF_DAY_TIME}`;

export const mapRecurrentWeeklyEvent = (event: CalendarEvent): MapRecurrenceEvent => {
  return {
    title: event.name || event.description || event.recurrenceId?.toDateString() || 'Reocurring weekly event',
    editable: true,
    duration: undefined,
    rrule: {
      freq: event.recurrence?.frequency,
      interval: event.recurrence?.interval,
      byweekday: event.recurrence?.daysOfWeek,
      dtstart: toLocalDateTime(event.start),
      until: toUntil(event.recurrence?.end?.until),
    },
  };
};
export const mapRecurrentMonthlyEvent = (event: CalendarEvent): MapRecurrenceEvent => {
  return {
    title: event.name || event.description || event.recurrenceId?.toDateString() || 'Reocurring monthly event',
    editable: true,
    duration: undefined,
    rrule: {
      freq: event.recurrence?.frequency,
      interval: event.recurrence?.interval,
      byweekday: event.recurrence?.daysOfWeek,
      dtstart: toLocalDateTime(event.start),
      until: toUntil(event.recurrence?.end?.until),
    },
  };
};

export const mapRecurrentYearlyEvent = (event: CalendarEvent): MapRecurrenceEvent => {
  return {
    title: event.name || event.description || event.recurrenceId?.toDateString() || 'Reocurring yearly event',
    duration: undefined,
    rrule: {
      freq: event.recurrence?.frequency,
      dtstart: toLocalDateTime(event.start),
      until: toUntil(event.recurrence?.end?.until),
    },
  };
};

// Main entry point for mapping reocurring events
export const mapRecurrenceEvent = (event: CalendarEvent): MapRecurrenceEvent | null => {
  if (event.recurrence?.frequency === 'weekly') return mapRecurrentWeeklyEvent(event);
  if (event.recurrence?.frequency === 'monthly') return mapRecurrentMonthlyEvent(event);
  if (event.recurrence?.frequency === 'yearly') return mapRecurrentYearlyEvent(event);

  return null;
};
