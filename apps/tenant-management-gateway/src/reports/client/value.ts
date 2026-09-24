import { adspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { UnauthorizedError } from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { EventMetrics, MetricResult } from '../types';

const VALUE_SERVICE_ID = adspId`urn:ads:platform:value-service:v1`;
const EVENT_LOG_NAMESPACE = 'event-service';
const EVENT_LOG_NAME = 'event';
const EVENT_PAGE_SIZE = 100;
const METRICS_PAGE_SIZE = 400;
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

function intervalMax(to: string): string {
  return `${to}T23:59:59.999Z`;
}

function timestampMaxExclusive(to: string): string {
  const end = new Date(`${to}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return end.toISOString();
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

  return {
    async readEventMetrics(token, metricLike, from, to) {
      const base = await resolveBase();
      const metrics: EventMetrics = {};
      let after: string | undefined;
      const seen = new Set<string>();
      for (;;) {
        const params: Record<string, string | number> = {
          interval: 'daily',
          top: METRICS_PAGE_SIZE,
          criteria: JSON.stringify({
            metricLike,
            intervalMin: `${from}T00:00:00.000Z`,
            intervalMax: intervalMax(to),
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
      return metrics;
    },

    async countDistinctContext(token, query, from, to) {
      const base = await resolveBase();
      const ids = new Set<string>();
      const collected = await Promise.all(
        query.eventNames.map((name) => readContextValues(base, token, query.namespace, name, query.contextKey, from, to))
      );
      collected.forEach((values) => values.forEach((id) => ids.add(id)));
      return ids.size;
    },
  };
}
