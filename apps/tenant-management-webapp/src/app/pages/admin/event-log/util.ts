import { DateTime } from 'luxon';
import { EventSearchCriteria } from '@store/event/models';

type ValidateResult = {
  ok: boolean;
  namespace?: string;
  name?: string;
  key?: string;
  reason?: string;
};
export function validateEventKey(
  input: string,
  eventKeys: string[],
  opts?: {
    namespaceException?: string;
    caseSensitive?: boolean;
  },
): ValidateResult {
  const namespaceException = opts?.namespaceException ?? 'access-service';
  const caseSensitive = opts?.caseSensitive ?? true;

  const raw = (input ?? '').trim();
  if (!raw) return { ok: false, reason: 'Empty value' };

  const idx = raw.indexOf(':');
  if (idx <= 0 || idx === raw.length - 1) {
    return { ok: false, reason: 'Must be in namespace:name format' };
  }

  const ns = raw.slice(0, idx).trim();
  const nm = raw.slice(idx + 1).trim();
  if (!ns || !nm) return { ok: false, reason: 'Namespace and name are required' };

  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());

  const keySet = new Set(eventKeys.map(norm));

  const nsNorm = norm(ns);
  const fullKeyNorm = norm(`${ns}:${nm}`);

  if (nsNorm === norm(namespaceException)) {
    const namespaceExists = eventKeys.some((k) => {
      const i = k.indexOf(':');
      if (i <= 0) return false;
      return norm(k.slice(0, i).trim()) === nsNorm;
    });

    if (!namespaceExists) {
      return { ok: false, reason: `Namespace "${ns}" does not exist` };
    }

    return { ok: true, namespace: ns, name: nm, key: `${ns}:${nm}` };
  }

  if (!keySet.has(fullKeyNorm)) {
    return { ok: false, reason: `"${ns}:${nm}" is not a valid event key` };
  }

  return { ok: true, namespace: ns, name: nm, key: `${ns}:${nm}` };
}

const EVENT_LOG_TIME_ZONE = 'America/Edmonton';
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const PRESET_HOURS = {
  'last-hour': 1,
  'last-24-hours': 24,
  'last-7-days': 7 * 24,
  'last-30-days': 30 * 24,
};

export const DATE_RANGE_OPTIONS = [
  { value: 'last-hour', label: 'Last hour' },
  { value: 'today', label: 'Today' },
  { value: 'last-24-hours', label: 'Last 24 hours' },
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom' },
] as const;

export type DateRangePreset = (typeof DATE_RANGE_OPTIONS)[number]['value'] | '';

export function toDateTimeLocalValue(date: Date): string {
  return DateTime.fromJSDate(date, { zone: EVENT_LOG_TIME_ZONE }).toFormat("yyyy-MM-dd'T'HH:mm");
}

export function fromDateTimeLocalValue(value: string): string {
  const date = DateTime.fromISO(value, { zone: EVENT_LOG_TIME_ZONE });
  // Reject nonexistent local times during the spring daylight saving transition.
  return date.isValid && date.toFormat("yyyy-MM-dd'T'HH:mm") === value ? date.toUTC().toISO() : '';
}

export function dateRangeCriteria(
  preset: Exclude<DateRangePreset, 'custom' | ''>,
  now = new Date(),
): EventSearchCriteria {
  const start =
    preset === 'today'
      ? DateTime.fromJSDate(now, { zone: EVENT_LOG_TIME_ZONE }).startOf('day').toJSDate()
      : new Date(now.getTime() - PRESET_HOURS[preset] * HOUR_IN_MILLISECONDS);
  return { namespace: '', name: '', timestampMin: start.toISOString(), timestampMax: now.toISOString() };
}

export const DEFAULT_DATE_RANGE = 'last-7-days';

export function defaultEventLogCriteria(): EventSearchCriteria {
  return dateRangeCriteria(DEFAULT_DATE_RANGE);
}

export function getDateRangeLabel(criteria: EventSearchCriteria, preset = getDateRangePreset(criteria)): string {
  if (!preset) return '';
  if (preset !== 'custom') return DATE_RANGE_OPTIONS.find((option) => option.value === preset).label;
  const from = criteria.timestampMin
    ? new Date(criteria.timestampMin).toLocaleString('en-CA', { timeZone: EVENT_LOG_TIME_ZONE })
    : 'Any start date';
  const to = criteria.timestampMax
    ? new Date(criteria.timestampMax).toLocaleString('en-CA', { timeZone: EVENT_LOG_TIME_ZONE })
    : 'Any end date';
  return `${from} – ${to}`;
}

export function getDateRangePreset(criteria: EventSearchCriteria): DateRangePreset {
  if (!criteria.timestampMin && !criteria.timestampMax) return '';
  if (!criteria.timestampMin || !criteria.timestampMax) return 'custom';
  const start = new Date(criteria.timestampMin).getTime();
  const end = new Date(criteria.timestampMax);
  if (!Number.isFinite(start) || !Number.isFinite(end.getTime())) return 'custom';
  if (criteria.timestampMin === dateRangeCriteria('today', end).timestampMin) return 'today';
  const duration = end.getTime() - start;
  return (
    (Object.keys(PRESET_HOURS) as (keyof typeof PRESET_HOURS)[]).find(
      (preset) => duration === PRESET_HOURS[preset] * HOUR_IN_MILLISECONDS,
    ) || 'custom'
  );
}

export function isValidDateRange(criteria: EventSearchCriteria): boolean {
  if (!criteria.timestampMin || !criteria.timestampMax) return false;
  const start = new Date(criteria.timestampMin).getTime();
  const end = new Date(criteria.timestampMax).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && start < end;
}
