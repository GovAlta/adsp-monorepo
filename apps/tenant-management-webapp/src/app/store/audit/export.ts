import type { AuditEventRecord } from './models';

const COLUMNS: [string, (event: AuditEventRecord) => unknown][] = [
  ['id', (e) => e.id],
  ['occurredAt', (e) => e.occurredAt],
  ['namespace', (e) => e.namespace],
  ['action', (e) => e.action],
  ['category', (e) => e.category],
  ['severity', (e) => e.severity],
  ['status', (e) => e.status],
  ['actorId', (e) => e.actor?.id],
  ['actorType', (e) => e.actor?.type],
  ['actorName', (e) => e.actor?.name],
  ['actorEmail', (e) => e.actor?.email],
  ['resourceType', (e) => e.resource?.type],
  ['resourceId', (e) => e.resource?.id],
  ['resourceName', (e) => e.resource?.name],
  ['scope', (e) => e.scope],
  ['correlationId', (e) => e.correlationId],
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
  let text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Design §1.5: personal information is removed from export responses unless the caller is audit-admin.
const PERSONAL_COLUMNS = ['actorName', 'actorEmail'];

export function eventsToCsv(events: AuditEventRecord[], includePersonalInfo = false): string {
  const columns = COLUMNS.filter(([name]) => includePersonalInfo || !PERSONAL_COLUMNS.includes(name));
  const rows = [columns.map(([name]) => name).join(',')];
  for (const event of events) {
    rows.push(columns.map(([, read]) => toCell(read(event))).join(','));
  }
  return rows.join('\r\n');
}

export function downloadFile(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
