import axios from 'axios';
import exportFromJSON from 'export-from-json';
import { EventLogEntry, EventSearchCriteria } from '@store/event/models';

// Event value payloads are unbounded jsonb, so pages are kept small to bound per-request cost.
export const EXPORT_PAGE_SIZE = 1000;

const REQUEST_TIMEOUT_MS = 30000;

// Raw entry shape returned by value-service: namespace/name live in `context`, the event body in `value.payload`.
interface RawEventValue {
  context: Record<string, string>;
  timestamp: string;
  correlationId?: string;
  value?: { payload?: Record<string, unknown> };
}

interface EventValueResponse {
  'event-service'?: { event?: RawEventValue[] };
  page?: { after?: string; next?: string };
}

const toEntry = (raw: RawEventValue): EventLogEntry => ({
  namespace: raw.context?.namespace,
  name: raw.context?.name,
  timestamp: new Date(raw.timestamp),
  correlationId: raw.correlationId,
  details: raw.value?.payload,
});

const buildEventUrl = (baseUrl: string, criteria: EventSearchCriteria, after: string): string => {
  let eventUrl = `${baseUrl}/value/v1/event-service/values/event?top=${EXPORT_PAGE_SIZE}&after=${after || ''}`;

  let contextObj: Record<string, unknown> = {};
  if (criteria.namespace) {
    contextObj['namespace'] = criteria.namespace;
  }
  if (criteria.name) {
    contextObj['name'] = criteria.name;
  }
  if (criteria.context) {
    contextObj = { ...contextObj, ...criteria.context };
  }
  if (Object.entries(contextObj).length > 0) {
    eventUrl = `${eventUrl}&context=${JSON.stringify(contextObj)}`;
  }
  if (criteria.timestampMax) {
    eventUrl = `${eventUrl}&timestampMax=${new Date(criteria.timestampMax).toISOString()}`;
  }
  if (criteria.applications) {
    eventUrl = `${eventUrl}&value=${criteria.applications}`;
  }
  if (criteria.url) {
    eventUrl = `${eventUrl}&url=${criteria.url}`;
  }
  if (criteria.timestampMin) {
    eventUrl = `${eventUrl}&timestampMin=${new Date(criteria.timestampMin).toISOString()}`;
  }
  if (criteria.correlationId) {
    eventUrl = `${eventUrl}&correlationId=${criteria.correlationId}`;
  }

  return eventUrl;
};

const toCsvRow = (entry: EventLogEntry) => ({
  timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '',
  namespace: entry.namespace ?? '',
  name: entry.name ?? '',
  correlationId: entry.correlationId ?? '',
  details: JSON.stringify(entry.details ?? {}),
});

export const fetchAllEventLogEntries = async (
  baseUrl: string,
  token: string,
  criteria: EventSearchCriteria,
): Promise<EventLogEntry[]> => {
  // Pin the upper bound so offset-based pagination sees a stable window across pages.
  const pinnedCriteria: EventSearchCriteria = {
    ...criteria,
    timestampMax: criteria?.timestampMax ?? new Date().toISOString(),
  };

  const entries: EventLogEntry[] = [];
  let after = '';
  do {
    const url = buildEventUrl(baseUrl, pinnedCriteria, after);
    const { data } = await axios.get<EventValueResponse>(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: REQUEST_TIMEOUT_MS,
    });
    entries.push(...(data?.['event-service']?.event ?? []).map(toEntry));
    after = data?.page?.next ?? '';
  } while (after);

  return entries;
};

export const exportEventLogEntries = async (
  baseUrl: string,
  token: string,
  fileName: string,
  criteria: EventSearchCriteria = {},
): Promise<number> => {
  const entries = await fetchAllEventLogEntries(baseUrl, token, criteria);
  const rows = entries.map(toCsvRow);

  exportFromJSON({
    data: rows.length ? rows : [{}],
    fileName,
    exportType: exportFromJSON.types.csv,
  });

  return entries.length;
};
