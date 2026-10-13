import { InvalidOperationError } from '@core-services/core-common';
import { DateTime, Duration } from 'luxon';
import { environment } from '../environments/environment';
import { toDateId, toTimeId } from '../utils';
import { CalendarEvent, EventRecurrence, RecurrenceDay, RecurrenceFrequency } from './types';

const { TIME_ZONE } = environment;

// Index + 1 is the luxon (ISO) weekday number.
export const DAYS_OF_WEEK: RecurrenceDay[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
export const RECURRENCE_FREQUENCIES: RecurrenceFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];
export const MAX_RECURRENCE_INTERVAL = 99;
export const MAX_RECURRENCE_COUNT = 1000;
const MAX_CANDIDATES = 100000;

export type RecurringSchedule = Pick<CalendarEvent, 'start' | 'end' | 'recurrence'> & {
  isAllDay?: boolean;
  exclusions?: number[];
};

export interface RecurrenceInstance {
  recurrenceId: DateTime;
  start: DateTime;
  end?: DateTime;
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function normalizeDaysOfWeek(start: DateTime, daysOfWeek: unknown): RecurrenceDay[] {
  const startDay = DAYS_OF_WEEK[start.weekday - 1];
  if (!isPresent(daysOfWeek)) {
    return [startDay];
  }

  if (
    !Array.isArray(daysOfWeek) ||
    daysOfWeek.length < 1 ||
    daysOfWeek.some((day) => !DAYS_OF_WEEK.includes(day)) ||
    new Set(daysOfWeek).size !== daysOfWeek.length
  ) {
    throw new InvalidOperationError(
      `recurrence.daysOfWeek must be a non-empty list of unique values from: ${DAYS_OF_WEEK.join(', ')}.`,
    );
  }

  if (!daysOfWeek.includes(startDay)) {
    throw new InvalidOperationError(`recurrence.daysOfWeek must include the day of the event start (${startDay}).`);
  }

  return DAYS_OF_WEEK.filter((day) => daysOfWeek.includes(day));
}

function normalizeEnd(start: DateTime, end: unknown, zone: string): EventRecurrence['end'] {
  if (!isPresent(end)) {
    return undefined;
  }

  if (typeof end !== 'object' || Array.isArray(end)) {
    throw new InvalidOperationError('recurrence.end must be an object.');
  }

  const { until, count } = end as EventRecurrence['end'];
  if (isPresent(until) && isPresent(count)) {
    throw new InvalidOperationError('recurrence.end can specify until or count, but not both.');
  }

  if (isPresent(count)) {
    if (!Number.isInteger(count) || count < 1 || count > MAX_RECURRENCE_COUNT) {
      throw new InvalidOperationError(`recurrence.end.count must be an integer from 1 to ${MAX_RECURRENCE_COUNT}.`);
    }
    return { count };
  }

  if (isPresent(until)) {
    const untilDate = typeof until === 'string' ? DateTime.fromISO(until, { zone }) : null;
    if (!untilDate?.isValid) {
      throw new InvalidOperationError('recurrence.end.until must be an ISO 8601 date.');
    }
    if (toDateId(untilDate, zone) < toDateId(start, zone)) {
      throw new InvalidOperationError('recurrence.end.until must not be before the start of the event.');
    }
    return { until: untilDate.toISODate() };
  }

  return undefined;
}

/**
 * Validates a recurrence against the event start and returns it with defaults applied.
 */
export function normalizeRecurrence(start: DateTime, recurrence: EventRecurrence, zone = TIME_ZONE): EventRecurrence {
  if (typeof recurrence !== 'object' || Array.isArray(recurrence)) {
    throw new InvalidOperationError('recurrence must be an object.');
  }

  if ('exclusions' in recurrence) {
    throw new InvalidOperationError(
      'recurrence.exclusions is read-only; cancel an occurrence using DELETE .../events/{id}/occurrences/{date}.',
    );
  }

  const { frequency, interval = 1, daysOfWeek, end } = recurrence;
  if (!RECURRENCE_FREQUENCIES.includes(frequency)) {
    throw new InvalidOperationError(`recurrence.frequency must be one of: ${RECURRENCE_FREQUENCIES.join(', ')}.`);
  }

  if (!Number.isInteger(interval) || interval < 1 || interval > MAX_RECURRENCE_INTERVAL) {
    throw new InvalidOperationError(`recurrence.interval must be an integer from 1 to ${MAX_RECURRENCE_INTERVAL}.`);
  }

  const localStart = start.setZone(zone);
  const normalized: EventRecurrence = { frequency, interval };

  if (frequency === 'weekly') {
    normalized.daysOfWeek = normalizeDaysOfWeek(localStart, daysOfWeek);
  } else if (isPresent(daysOfWeek)) {
    throw new InvalidOperationError('recurrence.daysOfWeek is only supported for weekly recurrence.');
  }

  const normalizedEnd = normalizeEnd(localStart, end, zone);
  if (normalizedEnd) {
    normalized.end = normalizedEnd;
  }

  return normalized;
}

function atLocalDate(time: DateTime, year: number, month: number, day: number): DateTime {
  return DateTime.fromObject(
    { year, month, day, hour: time.hour, minute: time.minute, second: time.second, millisecond: time.millisecond },
    { zone: time.zone },
  );
}

// Calendar math keeps the local wall time across DST; dates that don't exist (e.g. Feb 30) are skipped per RFC 5545.
function* generateCandidates(start: DateTime, recurrence: EventRecurrence): Generator<DateTime> {
  const interval = recurrence.interval || 1;
  const weekdays = (recurrence.daysOfWeek?.length ? recurrence.daysOfWeek : [DAYS_OF_WEEK[start.weekday - 1]])
    .map((day) => DAYS_OF_WEEK.indexOf(day) + 1)
    .sort((a, b) => a - b);
  // WKST=MO: weekly intervals count from the Monday of the start week.
  const weekStart = start.minus({ days: start.weekday - 1 });

  for (let n = 0; n < MAX_CANDIDATES; n++) {
    const step = n * interval;
    switch (recurrence.frequency) {
      case 'daily':
        yield start.plus({ days: step });
        break;
      case 'weekly':
        for (const weekday of weekdays) {
          const candidate = weekStart.plus({ weeks: step, days: weekday - 1 });
          if (candidate.valueOf() >= start.valueOf()) {
            yield candidate;
          }
        }
        break;
      case 'monthly': {
        const monthIndex = start.month - 1 + step;
        const candidate = atLocalDate(
          start,
          start.year + Math.floor(monthIndex / 12),
          (monthIndex % 12) + 1,
          start.day,
        );
        if (candidate.isValid) {
          yield candidate;
        }
        break;
      }
      case 'yearly': {
        const candidate = atLocalDate(start, start.year + step, start.month, start.day);
        if (candidate.isValid) {
          yield candidate;
        }
        break;
      }
      default:
        return;
    }
  }
}

// Applies UNTIL and COUNT; excluded occurrences still count towards COUNT.
function* generateOccurrenceStarts(start: DateTime, recurrence: EventRecurrence, zone: string): Generator<DateTime> {
  const untilDateId = recurrence.end?.until ? toDateId(DateTime.fromISO(recurrence.end.until, { zone }), zone) : null;
  const count = recurrence.end?.count;

  let generated = 0;
  for (const candidate of generateCandidates(start.setZone(zone), recurrence)) {
    if ((count && generated >= count) || (untilDateId && toDateId(candidate, zone) > untilDateId)) {
      return;
    }
    generated++;
    yield candidate;
  }
}

function getDuration(start: DateTime, end: DateTime | undefined, zone: string): Duration | null {
  return end ? end.setZone(zone).diff(start.setZone(zone), ['days', 'minutes']) : null;
}

function toMinuteKey(value: DateTime, zone: string): number {
  return toDateId(value, zone) * 10000 + toTimeId(value, zone);
}

/**
 * Returns the occurrences of a recurring event that overlap the from/to range, excluding cancelled occurrences.
 */
export function expandOccurrences(
  { start, end, isAllDay, recurrence, exclusions = [] }: RecurringSchedule,
  from: DateTime,
  to: DateTime,
  zone = TIME_ZONE,
): RecurrenceInstance[] {
  if (!recurrence) {
    return [];
  }

  // Same overlap rules as the non-recurring range query: all-day events compare dates only.
  const startsBy = (value: DateTime) =>
    isAllDay ? toDateId(value, zone) <= toDateId(to, zone) : toMinuteKey(value, zone) <= toMinuteKey(to, zone);
  const endsFrom = (value: DateTime) =>
    isAllDay ? toDateId(value, zone) >= toDateId(from, zone) : toMinuteKey(value, zone) >= toMinuteKey(from, zone);

  const duration = getDuration(start, end, zone);
  const excluded = new Set(exclusions);
  const results: RecurrenceInstance[] = [];

  for (const occurrenceStart of generateOccurrenceStarts(start, recurrence, zone)) {
    if (!startsBy(occurrenceStart)) {
      break;
    }

    if (excluded.has(toDateId(occurrenceStart, zone))) {
      continue;
    }

    const occurrenceEnd = duration ? occurrenceStart.plus(duration) : null;
    // Occurrences without an end are instants rather than open-ended.
    if (endsFrom(occurrenceEnd ?? occurrenceStart)) {
      results.push({ recurrenceId: occurrenceStart, start: occurrenceStart, end: occurrenceEnd });
    }
  }

  return results;
}

/**
 * Returns the start of the occurrence generated on the local date of the value, or null if there isn't one.
 */
export function findOccurrence(
  { start, recurrence }: RecurringSchedule,
  value: DateTime,
  zone = TIME_ZONE,
): DateTime | null {
  if (!recurrence) {
    return null;
  }

  const dateId = toDateId(value, zone);
  for (const occurrenceStart of generateOccurrenceStarts(start, recurrence, zone)) {
    const occurrenceDateId = toDateId(occurrenceStart, zone);
    if (occurrenceDateId === dateId) {
      return occurrenceStart;
    } else if (occurrenceDateId > dateId) {
      break;
    }
  }

  return null;
}

/**
 * Returns the date ID of the end of the last occurrence, or null if the recurrence has no end.
 */
export function getRecurrenceEndDate({ start, end, recurrence }: RecurringSchedule, zone = TIME_ZONE): number | null {
  if (!recurrence?.end) {
    return null;
  }

  const localStart = start.setZone(zone);
  let lastStart: DateTime = null;
  if (recurrence.end.count) {
    for (const occurrenceStart of generateOccurrenceStarts(localStart, recurrence, zone)) {
      lastStart = occurrenceStart;
    }
  } else if (recurrence.end.until) {
    const until = DateTime.fromISO(recurrence.end.until, { zone });
    lastStart = atLocalDate(localStart, until.year, until.month, until.day);
  }

  if (!lastStart?.isValid) {
    return null;
  }

  const duration = getDuration(start, end, zone);
  return toDateId(duration ? lastStart.plus(duration) : lastStart, zone);
}

/**
 * Converts an occurrence date ID back to the occurrence start (RFC 5545 RECURRENCE-ID).
 */
export function toRecurrenceId(start: DateTime, occurrenceDate: number, zone = TIME_ZONE): DateTime {
  return atLocalDate(
    start.setZone(zone),
    Math.floor(occurrenceDate / 10000),
    Math.floor(occurrenceDate / 100) % 100,
    occurrenceDate % 100,
  );
}
