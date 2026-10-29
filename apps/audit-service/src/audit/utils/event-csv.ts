import type { serializeEvent } from '../router/read-events';

type SerializedEvent = ReturnType<typeof serializeEvent>;

const COLUMNS: [string, (event: SerializedEvent) => unknown, personal?: true][] = [
  ['id', (e) => e.id],
  ['eventId', (e) => e.eventId],
  ['occurredAt', (e) => e.occurredAt],
  ['namespace', (e) => e.namespace],
  ['action', (e) => e.action],
  ['category', (e) => e.category],
  ['severity', (e) => e.severity],
  ['status', (e) => e.status],
  ['actorId', (e) => e.actor.id],
  ['actorType', (e) => e.actor.type],
  ['actorName', (e) => e.actor.name, true],
  ['actorEmail', (e) => e.actor.email, true],
  ['resourceType', (e) => e.resource?.type],
  ['resourceId', (e) => e.resource?.id],
  ['resourceName', (e) => e.resource?.name],
  ['scope', (e) => e.scopeIds?.join(';')],
  ['correlationId', (e) => e.correlationId],
  ['sessionId', (e) => e.sessionId],
  ['retentionClass', (e) => e.retentionClass],
  ['retentionUntil', (e) => e.retentionUntil],
  ['changeSet', (e) => e.changeSet],
  ['metadata', (e) => e.metadata],
];

// Values starting with these characters are interpreted as formulas by spreadsheet applications.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function toCell(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  let text =
    value instanceof Date ? value.toISOString() : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface EventCsvFormat {
  header: string;
  rows(events: SerializedEvent[]): string;
}

// Actor name and email are personal information, left out entirely unless includePersonalInfo is set.
export function createEventCsvFormat(includePersonalInfo: boolean): EventCsvFormat {
  const columns = COLUMNS.filter(([, , personal]) => includePersonalInfo || !personal);
  return {
    header: columns.map(([name]) => name).join(',') + '\r\n',
    rows: (events) => events.map((event) => columns.map(([, read]) => toCell(read(event))).join(',') + '\r\n').join(''),
  };
}
