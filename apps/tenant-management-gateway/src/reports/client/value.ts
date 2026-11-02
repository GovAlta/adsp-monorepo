import { adspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { UnauthorizedError } from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { EventMetrics, MetricResult } from '../types';

const VALUE_SERVICE_ID = adspId`urn:ads:platform:value-service:v1`;
const EVENT_LOG_NAMESPACE = 'event-service';
const EVENT_LOG_NAME = 'event';
const EVENT_PAGE_SIZE = 1000;
const METRICS_PAGE_SIZE = 400;
/**
 * Most recent days read on their own. The rollup job composes a day some time after it closes, and
 * value-service falls back to aggregating raw metrics for the whole window when any of it is not
 * rolled up yet — so the not-yet-composed days are kept out of the long windows.
 */
const TRAILING_DAYS = 2;
const USER_AGENT =
  'Mozilla/5.0 (compatible; ADSP-tenant-management-gateway/1.0; +https://adsp.alberta.ca)';

export interface DistinctContextQuery {
  namespace: string;
  eventNames: string[];
  contextKey: string;
}

export interface ValueServiceClient {
  readEventMetrics(token: string, metricLike: string, from: string, to: string): Promise<EventMetrics>;
  countDistinctContext(token: string, query: DistinctContextQuery, from: string, to: string): Promise<number>;
}

interface EventLogRecord {
  context?: Record<string, unknown>;
}

interface PageInfo {
  next?: string;
  size?: number;
}

interface EventLogResponse {
  page?: PageInfo;
  'event-service'?: { event?: EventLogRecord[] };
}

interface MetricsResponse {
  page?: PageInfo;
  [metricName: string]: MetricResult | PageInfo | undefined;
}

export interface ValueClientProps {
  directory?: ServiceDirectory;
  valueServiceUrl?: string;
}

function withTrailingSlash(url: URL): URL {
  const href = url.href.endsWith('/') ? url.href : `${url.href}/`;
  return new URL(href);
}

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().substring(0, 10);
}

function firstOfMonth(day: string): string {
  return `${day.substring(0, 7)}-01`;
}

function firstOfNextMonth(day: string): string {
  const date = new Date(`${firstOfMonth(day)}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().substring(0, 10);
}

/** Value-service serves buckets starting before an exclusive max, so `to` needs the next midnight. */
function timestampMaxExclusive(to: string): string {
  return `${addDays(to, 1)}T00:00:00.000Z`;
}

export interface MetricWindow {
  interval: 'daily' | 'monthly';
  /** Inclusive yyyy-mm-dd. */
  from: string;
  /** Inclusive yyyy-mm-dd. */
  to: string;
}

/**
 * Split a report period so each piece is answered from the rollups: whole calendar months from the
 * monthly rollup, the partial months either side from daily, and the trailing days on their own so a
 * day the rollup job has not composed yet only drags that small window back to raw metrics.
 */
export function splitMetricWindows(from: string, to: string): MetricWindow[] {
  const windows: MetricWindow[] = [];
  const recentFrom = addDays(to, 1 - TRAILING_DAYS) > from ? addDays(to, 1 - TRAILING_DAYS) : from;
  const settledTo = addDays(recentFrom, -1);

  if (from <= settledTo) {
    const monthsFrom = from === firstOfMonth(from) ? from : firstOfNextMonth(from);
    const monthsTo =
      addDays(settledTo, 1) === firstOfNextMonth(settledTo) ? settledTo : addDays(firstOfMonth(settledTo), -1);

    if (monthsFrom <= monthsTo) {
      if (from < monthsFrom) {
        windows.push({ interval: 'daily', from, to: addDays(monthsFrom, -1) });
      }
      windows.push({ interval: 'monthly', from: monthsFrom, to: monthsTo });
      if (monthsTo < settledTo) {
        windows.push({ interval: 'daily', from: addDays(monthsTo, 1), to: settledTo });
      }
    } else {
      windows.push({ interval: 'daily', from, to: settledTo });
    }
  }

  windows.push({ interval: 'daily', from: recentFrom, to });
  return windows;
}

/**
 * Split a period into calendar months, so a long period's event log is read as many short scans in
 * parallel rather than one long scan paged in sequence.
 */
export function splitMonths(from: string, to: string): { from: string; to: string }[] {
  const months: { from: string; to: string }[] = [];
  for (let start = from; start <= to; start = firstOfNextMonth(start)) {
    const end = addDays(firstOfNextMonth(start), -1);
    months.push({ from: start, to: end < to ? end : to });
  }
  return months;
}

/** Return the next cursor, or stop when value-service repeats one it already sent. */
function followCursor(next: string | undefined, seen: Set<string>): string | undefined {
  if (!next || seen.has(next)) {
    return undefined;
  }
  seen.add(next);
  return next;
}

function appendMetrics(target: EventMetrics, page: Omit<MetricsResponse, 'page'>): boolean {
  let appended = false;
  Object.entries(page).forEach(([name, metric]) => {
    if (!metric || !('values' in metric) || !Array.isArray(metric.values) || metric.values.length === 0) {
      return;
    }
    appended = true;
    const existing = target[name];
    if (!existing) {
      target[name] = { name: metric.name || name, values: metric.values.slice() };
      return;
    }
    existing.values.push(...metric.values);
  });
  return appended;
}

function rethrowValueServiceError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === HttpStatusCodes.UNAUTHORIZED || status === HttpStatusCodes.FORBIDDEN) {
      throw new UnauthorizedError('Not authorized to read report data.');
    }
  }
  throw err;
}

export function createValueServiceClient({ directory, valueServiceUrl }: ValueClientProps): ValueServiceClient {
  const resolveBase = async (): Promise<URL> => {
    if (valueServiceUrl) {
      return withTrailingSlash(new URL(valueServiceUrl));
    }
    if (!directory) {
      throw new Error('VALUE_SERVICE_URL is required when the platform directory is not configured.');
    }
    const url = await directory.getServiceUrl(VALUE_SERVICE_ID);
    return withTrailingSlash(url);
  };

  const headers = (token: string) => ({
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
  });

  const readContextValues = async (
    base: URL,
    token: string,
    namespace: string,
    name: string,
    contextKey: string,
    from: string,
    to: string
  ): Promise<string[]> => {
    const values: string[] = [];
    let after: string | undefined;
    const seen = new Set<string>();
    for (;;) {
      const params: Record<string, string | number> = {
        top: EVENT_PAGE_SIZE,
        timestampMin: `${from}T00:00:00.000Z`,
        timestampMax: timestampMaxExclusive(to),
        context: JSON.stringify({ namespace, name }),
      };
      if (after) {
        params.after = after;
      }

      let data: EventLogResponse;
      try {
        const response = await axios.get<EventLogResponse>(
          new URL(`${EVENT_LOG_NAMESPACE}/values/${EVENT_LOG_NAME}`, base).href,
          {
            headers: headers(token),
            params,
          }
        );
        data = response.data;
      } catch (err) {
        rethrowValueServiceError(err);
      }

      const events = data?.[EVENT_LOG_NAMESPACE]?.[EVENT_LOG_NAME] || [];
      events.forEach((event) => {
        const value = event.context?.[contextKey];
        if (value !== undefined && value !== null && value !== '') {
          values.push(String(value));
        }
      });

      if (events.length === 0) {
        break;
      }
      after = followCursor(data?.page?.next, seen);
      if (!after) {
        break;
      }
    }

    return values;
  };

  const readMetricWindow = async (
    base: URL,
    token: string,
    metricLike: string,
    window: MetricWindow,
    metrics: EventMetrics
  ): Promise<void> => {
    let after: string | undefined;
    const seen = new Set<string>();
    for (;;) {
      const params: Record<string, string | number> = {
        interval: window.interval,
        top: METRICS_PAGE_SIZE,
        criteria: JSON.stringify({
          metricLike,
          intervalMin: `${window.from}T00:00:00.000Z`,
          intervalMax: timestampMaxExclusive(window.to),
        }),
      };
      if (after) {
        params.after = after;
      }

      let data: MetricsResponse;
      try {
        const response = await axios.get<MetricsResponse>(new URL('event-service/values/event/metrics', base).href, {
          headers: headers(token),
          params,
        });
        data = response.data;
      } catch (err) {
        rethrowValueServiceError(err);
      }

      const { page, ...pageMetrics } = data || {};
      const appended = appendMetrics(metrics, pageMetrics);
      if (!appended) {
        break;
      }
      after = followCursor(page?.next, seen);
      if (!after) {
        break;
      }
    }
  };

  return {
    async readEventMetrics(token, metricLike, from, to) {
      const base = await resolveBase();
      const windows = splitMetricWindows(from, to);
      const perWindow = windows.map((): EventMetrics => ({}));
      await Promise.all(
        windows.map((window, index) => readMetricWindow(base, token, metricLike, window, perWindow[index]))
      );

      // Merged in window order so rows come back oldest window first, whichever request finished first.
      const metrics: EventMetrics = {};
      perWindow.forEach((windowMetrics) => appendMetrics(metrics, windowMetrics));
      return metrics;
    },

    async countDistinctContext(token, query, from, to) {
      const base = await resolveBase();
      const ids = new Set<string>();
      const months = splitMonths(from, to);
      const collected = await Promise.all(
        query.eventNames.flatMap((name) =>
          months.map((month) =>
            readContextValues(base, token, query.namespace, name, query.contextKey, month.from, month.to)
          )
        )
      );
      collected.forEach((values) => values.forEach((id) => ids.add(id)));
      return ids.size;
    },
  };
}
