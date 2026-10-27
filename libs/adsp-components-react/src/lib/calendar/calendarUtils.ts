import { DateRange } from '@abgov/adsp-components-core';
import { DEFAULT_RANGE_DAYS } from './types';

export const toLocalDateTime = (date: Date): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Edmonton',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      timeZoneName: 'longOffset',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  // longOffset yields 'GMT-06:00'; only the offset is needed.
  const offset = parts.timeZoneName.replace('GMT', '');
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${parts.fractionalSecond}${offset}`;
};

// 11:59 PM and exactly 11:00 PM (used for recurrence end dates) are end-of-day markers, not a time part.
export const hasTimePart = (value: string | undefined): boolean => {
  if (!value) return false;

  // Date-only strings parse as UTC midnight, which would shift to a non-midnight local time.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(value);
  if (isNaN(date.getTime())) return false;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isExactHour = minutes === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
  const isMidnight = hours === 0 && isExactHour;
  const isEndOfDay = (hours === 23 && minutes === 59) || (hours === 23 && isExactHour);

  return !isMidnight && !isEndOfDay;
};

export const getDefaultDateRange = (): DateRange => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - DEFAULT_RANGE_DAYS);
  return { start, end };
};
