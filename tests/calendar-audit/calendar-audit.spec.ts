import { APIRequestContext, expect, request, test } from '@playwright/test';

/**
 * Verifies OSP-823: calendar service records audit events in the `calendar-service` namespace.
 *
 * Default setup: local calendar service (http://localhost:3341) writing to the dev audit service.
 * The local service must run against dev: KEYCLOAK_ROOT_URL=https://access.adsp-dev.gov.ab.ca,
 * DIRECTORY_URL=https://directory-service.adsp-dev.gov.ab.ca, plus CLIENT_SECRET of a dev client
 * with the audit-writer role on urn:ads:platform:audit-service.
 *
 * Required environment:
 *   ACCESS_TOKEN        Dev tenant user token with the calendar-admin role.
 * Optional:
 *   CALENDAR_URL        Defaults to http://localhost:3341
 *   AUDIT_URL           Defaults to https://audit-service-adsp-dev.apps.aro-01.int.gov.ab.ca
 *   AUDIT_ACCESS_TOKEN  Token with the audit-reader role of the same tenant; defaults to ACCESS_TOKEN.
 */
const CALENDAR_URL = process.env.CALENDAR_URL || 'http://localhost:3341';
const AUDIT_URL = process.env.AUDIT_URL || 'https://audit-service-adsp-dev.apps.aro-01.int.gov.ab.ca';
const { KEYCLOAK_ROOT_URL, TENANT_REALM, CLIENT_ID, CLIENT_SECRET } = process.env;
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;
let AUDIT_ACCESS_TOKEN = process.env.AUDIT_ACCESS_TOKEN;

// Falls back to a client-credentials token from the (gitignored) .env when ACCESS_TOKEN is not provided.
async function fetchToken(): Promise<string | undefined> {
  if (!KEYCLOAK_ROOT_URL || !TENANT_REALM || !CLIENT_ID || !CLIENT_SECRET) {
    return undefined;
  }
  const context = await request.newContext();
  const response = await context.post(`${KEYCLOAK_ROOT_URL}/auth/realms/${TENANT_REALM}/protocol/openid-connect/token`, {
    form: { grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
  });
  const token = response.ok() ? (await response.json()).access_token : undefined;
  await context.dispose();
  return token;
}

const ATTENDEE_EMAIL = 'pw-audit-attendee@example.com';
const calendarName = `audit-pw-${Date.now()}`;

interface AuditRecord {
  action: string;
  severity: string;
  category: string;
  retentionClass: string;
  actor: { id: string };
  resource?: { type: string; id: string; name?: string };
  metadata?: Record<string, unknown>;
  changeSet?: { before?: unknown; after?: unknown };
}

test.describe('calendar service audit integration', () => {
  test.describe.configure({ mode: 'serial' });

  let calendar: APIRequestContext;
  let audit: APIRequestContext;
  let startedAt: string;
  let eventId: number;
  let recurringEventId: number;
  let attendeeId: number;

  const definition = {
    name: calendarName,
    displayName: 'Audit PW',
    description: 'Playwright audit verification',
    readRoles: [],
    updateRoles: [],
  };

  // Audit records are written asynchronously, so poll until the expected record appears.
  async function findAudit(action: string, resourceId: string): Promise<AuditRecord> {
    let found: AuditRecord | undefined;
    await expect
      .poll(
        async () => {
          const response = await audit.get('/audit/v1/calendar-service/events', {
            params: { action, resourceId, occurredFrom: startedAt, top: 50 },
          });
          expect(response.ok()).toBeTruthy();
          const { results } = (await response.json()) as { results: AuditRecord[] };
          found = results[0];
          return results.length;
        },
        { timeout: 30_000, message: `audit record ${action} for ${resourceId}` },
      )
      .toBeGreaterThan(0);
    return found as AuditRecord;
  }

  async function countAudit(action: string, resourceId: string): Promise<number> {
    const response = await audit.get('/audit/v1/calendar-service/events', {
      params: { action, resourceId, occurredFrom: startedAt },
    });
    return ((await response.json()) as { results: unknown[] }).results.length;
  }

  test.beforeAll(async () => {
    ACCESS_TOKEN = ACCESS_TOKEN || (await fetchToken());
    AUDIT_ACCESS_TOKEN = AUDIT_ACCESS_TOKEN || ACCESS_TOKEN;
    expect(ACCESS_TOKEN, 'Set ACCESS_TOKEN or the client credentials in .env').toBeTruthy();

    startedAt = new Date().toISOString();
    calendar = await request.newContext({
      baseURL: CALENDAR_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    audit = await request.newContext({
      baseURL: AUDIT_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${AUDIT_ACCESS_TOKEN}` },
    });
  });

  test.afterAll(async () => {
    // Best effort cleanup in case the flow failed part way through.
    for (const id of [eventId, recurringEventId].filter(Boolean)) {
      await calendar.delete(`/calendar/v1/calendars/${calendarName}/events/${id}`).catch(() => undefined);
    }
    await calendar.delete(`/calendar/v1/calendars/${calendarName}`).catch(() => undefined);
    await calendar.dispose();
    await audit.dispose();
  });

  test('calendar.created', async () => {
    const response = await calendar.post('/calendar/v1/calendars', { data: definition });
    expect(response.status()).toBe(201);

    const record = await findAudit('calendar.created', calendarName);
    expect(record).toMatchObject({
      category: 'administrative',
      severity: 'info',
      retentionClass: 'standard',
      resource: { type: 'calendar', id: calendarName },
      metadata: { calendarName },
    });
    expect(record.actor.id).toBeTruthy();
  });

  test('calendar.updated', async () => {
    const response = await calendar.put(`/calendar/v1/calendars/${calendarName}`, {
      data: { ...definition, updateRoles: ['audit-pw-updater'] },
    });
    expect(response.status()).toBe(200);

    const record = await findAudit('calendar.updated', calendarName);
    expect(record.metadata).toMatchObject({ updatedFields: ['updateRoles'] });
  });

  test('event.created', async () => {
    const response = await calendar.post(`/calendar/v1/calendars/${calendarName}/events`, {
      data: { name: 'PW event', start: '2030-03-04T10:00:00-07:00', end: '2030-03-04T11:00:00-07:00' },
    });
    expect(response.ok()).toBeTruthy();
    eventId = (await response.json()).id;

    const record = await findAudit('event.created', `${eventId}`);
    expect(record).toMatchObject({
      category: 'administrative',
      retentionClass: 'standard',
      resource: { type: 'event', id: `${eventId}` },
      metadata: { calendarName, eventName: 'PW event' },
    });
  });

  test('event.updated', async () => {
    const response = await calendar.patch(`/calendar/v1/calendars/${calendarName}/events/${eventId}`, {
      data: { name: 'PW event renamed' },
    });
    expect(response.ok()).toBeTruthy();

    const record = await findAudit('event.updated', `${eventId}`);
    expect(record.metadata).toMatchObject({ eventName: 'PW event renamed' });
  });

  test('attendee.added records the name but never the email', async () => {
    const response = await calendar.post(`/calendar/v1/calendars/${calendarName}/events/${eventId}/attendees`, {
      data: { name: 'PW Attendee', email: ATTENDEE_EMAIL },
    });
    expect(response.ok()).toBeTruthy();
    attendeeId = (await response.json()).id;

    const record = await findAudit('attendee.added', `${eventId}`);
    expect(record).toMatchObject({ retentionClass: 'compliance' });
    expect(record.metadata).toMatchObject({ attendeeName: 'PW Attendee' });
    expect(JSON.stringify(record)).not.toContain(ATTENDEE_EMAIL);
  });

  test('attendee.removed records the name but never the email', async () => {
    const response = await calendar.delete(
      `/calendar/v1/calendars/${calendarName}/events/${eventId}/attendees/${attendeeId}`,
    );
    expect(response.ok()).toBeTruthy();

    const record = await findAudit('attendee.removed', `${eventId}`);
    expect(record.metadata).toMatchObject({ attendeeName: 'PW Attendee' });
    expect(JSON.stringify(record)).not.toContain(ATTENDEE_EMAIL);
  });

  test('cancelling an occurrence records event.occurrence-cancelled, not event.deleted', async () => {
    const created = await calendar.post(`/calendar/v1/calendars/${calendarName}/events`, {
      data: {
        name: 'PW recurring',
        start: '2030-03-04T10:00:00-07:00',
        end: '2030-03-04T11:00:00-07:00',
        recurrence: { frequency: 'daily', interval: 1, end: { count: 5 } },
      },
    });
    expect(created.ok()).toBeTruthy();
    recurringEventId = (await created.json()).id;

    const cancelled = await calendar.delete(
      `/calendar/v1/calendars/${calendarName}/events/${recurringEventId}/occurrences/2030-03-06`,
    );
    expect(cancelled.ok()).toBeTruthy();

    await findAudit('event.occurrence-cancelled', `${recurringEventId}`);
    expect(await countAudit('event.deleted', `${recurringEventId}`)).toBe(0);
  });

  test('reads and failed operations produce no audit records', async () => {
    for (const path of [
      '/calendar/v1/calendars',
      `/calendar/v1/calendars/${calendarName}`,
      `/calendar/v1/calendars/${calendarName}/events`,
    ]) {
      expect((await calendar.get(path)).ok()).toBeTruthy();
    }
    // Deleting a calendar that still has events fails with 409 and must not be audited.
    const conflict = await calendar.delete(`/calendar/v1/calendars/${calendarName}`);
    expect(conflict.status()).toBe(409);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    expect(await countAudit('calendar.deleted', calendarName)).toBe(0);

    const all = await audit.get('/audit/v1/calendar-service/events', {
      params: { occurredFrom: startedAt, top: 100 },
    });
    const { results } = (await all.json()) as { results: AuditRecord[] };
    expect(results.every((r) => /^(calendar|event|attendee)\.(created|updated|deleted|added|removed|occurrence-cancelled)$/.test(r.action))).toBeTruthy();
  });

  test('event.deleted has warning severity', async () => {
    const response = await calendar.delete(`/calendar/v1/calendars/${calendarName}/events/${eventId}`);
    expect(response.ok()).toBeTruthy();

    const record = await findAudit('event.deleted', `${eventId}`);
    expect(record).toMatchObject({ severity: 'warning', retentionClass: 'standard' });
  });

  test('calendar.deleted has warning severity', async () => {
    const removed = await calendar.delete(`/calendar/v1/calendars/${calendarName}/events/${recurringEventId}`);
    expect(removed.ok()).toBeTruthy();

    const response = await calendar.delete(`/calendar/v1/calendars/${calendarName}`);
    expect(response.status()).toBe(204);

    const record = await findAudit('calendar.deleted', calendarName);
    expect(record).toMatchObject({ severity: 'warning', retentionClass: 'standard' });
  });
});
