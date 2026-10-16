import { CalendarEvent, CalendarHoliday, DateRange } from './types';

const TIME_ZONE = 'America/Edmonton';

export interface CalendarServiceEvent {
  id: number;
  name: string;
  description?: string;
  start: string;
  end?: string | null;
  isAllDay?: boolean;
  isPublic?: boolean;
  recordId?: string;
  context?: Record<string, unknown>;
}

export interface CalendarServiceDate {
  id: number;
  holiday?: string | null;
  isInLieuOfDay?: boolean;
}

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});

function getAlbertaParts(value: Date) {
  const parts = Object.fromEntries(dateFormat.formatToParts(value).map(({ type, value }) => [type, value]));
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour };
}

/** Calendar Service dates are identified by the Alberta calendar day as yyyyMMdd. */
export function toDateId(value: Date): number {
  const { year, month, day } = getAlbertaParts(value);
  return year * 10000 + month * 100 + day;
}

function fromDateId(id: number): Date {
  const year = Math.floor(id / 10000);
  const month = Math.floor(id / 100) % 100;
  const day = id % 100;

  // Alberta is UTC-7 (MST) or UTC-6 (MDT); pick the offset where local time is midnight.
  for (const offset of [7, 6]) {
    const candidate = new Date(Date.UTC(year, month - 1, day, offset));
    const { hour, day: localDay } = getAlbertaParts(candidate);
    if (hour === 0 && localDay === day) {
      return candidate;
    }
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function getDateIdRange({ start, end }: DateRange): { min: number; max: number } {
  const min = toDateId(start);
  // The range end is exclusive, so the last included day is the one containing the instant before it.
  const max = Math.max(min, toDateId(new Date(end.getTime() - 1)));
  return { min, max };
}

export function mapEvent(event: CalendarServiceEvent): CalendarEvent {
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    start: new Date(event.start),
    end: event.end ? new Date(event.end) : null,
    isAllDay: !!event.isAllDay,
    isPublic: !!event.isPublic,
    recordId: event.recordId,
    context: event.context,
  };
}

export function mapHoliday(date: CalendarServiceDate): CalendarHoliday {
  return {
    date: fromDateId(date.id),
    name: date.holiday || '',
    isInLieuOfDay: !!date.isInLieuOfDay,
  };
}

/** Events overlap the range if they are active at any point in (start, end); events without a duration are points. */
export function isEventInRange(event: CalendarEvent, range: DateRange): boolean {
  const start = event.start.getTime();
  const end = event.end?.getTime();

  return end == null || end <= start
    ? start >= range.start.getTime() && start < range.end.getTime()
    : start < range.end.getTime() && end > range.start.getTime();
}
