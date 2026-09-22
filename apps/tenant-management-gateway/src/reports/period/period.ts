import { InvalidOperationError } from '@core-services/core-common';
import { ReportPeriod } from '../types';

export const MAX_PERIOD_MONTHS = 13;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseIsoDate(value: string): Date {
  const match = ISO_DATE.exec(value);
  if (!match) {
    throw new InvalidOperationError('from and to must be yyyy-mm-dd.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new InvalidOperationError('from and to must be valid calendar dates.');
  }

  return date;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function lastCompletedUtcDay(now = new Date()): Date {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(today.getTime() - MS_PER_DAY);
}

export function addUtcMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth(), Math.min(day, lastDay)));
}

/**
 * Validate from/to and clip `to` to the last completed UTC day (value-service rollups
 * do not include today). Returns the effective inclusive period used for reads.
 */
export function resolveReportPeriod(fromValue: string, toValue: string, now = new Date()): ReportPeriod {
  const from = parseIsoDate(fromValue);
  const to = parseIsoDate(toValue);

  if (from > to) {
    throw new InvalidOperationError('from must be on or before to.');
  }

  if (to > addUtcMonths(from, MAX_PERIOD_MONTHS)) {
    throw new InvalidOperationError(`The reporting period cannot exceed ${MAX_PERIOD_MONTHS} months.`);
  }

  const lastCompleted = lastCompletedUtcDay(now);
  const effectiveTo = to > lastCompleted ? lastCompleted : to;

  if (from > effectiveTo) {
    return { from: formatIsoDate(from), to: formatIsoDate(effectiveTo) };
  }

  return { from: formatIsoDate(from), to: formatIsoDate(effectiveTo) };
}

export function isEmptyPeriod(period: ReportPeriod): boolean {
  return parseIsoDate(period.from) > parseIsoDate(period.to);
}
