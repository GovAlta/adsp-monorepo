import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { SelfAuditActions } from '../model';
import { CatalogService, RetentionService } from '../model';
import { AuditServiceRoles } from '../roles';
import { EventReader, StoredEvent } from '../types';
import type { SelfAuditor } from '../utils/self-audit';
import { createAuditRouter } from './index';

const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
const tenant = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;

const makeEvent = (index: number, overrides: Partial<StoredEvent> = {}): StoredEvent => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  event_id: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  tenant_id: tenant.toString(),
  namespace: 'case-service',
  written_by: 'urn:ads:platform:case-service',
  occurred_at: new Date(Date.UTC(2026, 9, 1, 10, 0, 0) - index * 1000),
  received_at: new Date('2026-10-01T10:00:01Z'),
  action: 'case.update.succeeded',
  action_version: 1,
  category: 'administrative',
  status: 'success',
  severity: 'info',
  actor_id: 'user-1',
  actor_type: 'user',
  actor_name: 'Jane Doe',
  actor_email: 'jane@example.test',
  actor_roles: [],
  resource_type: 'case',
  resource_id: 'c-1',
  resource_name: null,
  scope_ids: ['s-1', 's-2'],
  correlation_id: null,
  session_id: null,
  change_set_before: null,
  change_set_after: null,
  metadata: {},
  retention_class: 'compliance',
  retention_until: new Date('2033-10-01T10:00:00Z'),
  ...overrides,
});

describe('export events', () => {
  const reader: jest.Mocked<EventReader> = { find: jest.fn(), get: jest.fn(), findNamespaces: jest.fn() };
  const auditor = { record: jest.fn() };
  const user: User = {
    id: 'reader',
    name: 'Reader',
    email: 'reader@example.test',
    isCore: false,
    roles: [AuditServiceRoles.Reader],
    tenantId: tenant,
    token: { azp: 'ui', aud: 'audit-service', iss: 'tenant-issuer', bearer: 'test', email_verified: true },
  };

  function createApp(caller: User | null = user) {
    const app = express();
    app.use((req, _res, next) => {
      req.user = caller;
      req.tenant = { id: caller?.tenantId, name: 'Tenant', realm: 'tenant' };
      req.isAuthenticated = (): this is Express.AuthenticatedRequest => !!caller;
      next();
    });
    app.use(
      '/audit/v1',
      createAuditRouter({
        catalogs: {} as CatalogService,
        retention: {} as RetentionService,
        logger,
        reader,
        auditor: auditor as unknown as SelfAuditor,
      }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    reader.find.mockResolvedValue([makeEvent(1)]);
  });

  it('returns a CSV attachment without actor name and email for audit-reader', async () => {
    const res = await request(createApp()).get('/audit/v1/events/export?action=case.update.succeeded');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="audit-events-\d{4}-\d{2}-\d{2}\.csv"$/);
    const [header, row] = res.text.trim().split('\r\n');
    expect(header).not.toContain('actorName');
    expect(header).not.toContain('actorEmail');
    expect(res.text).not.toContain('Jane Doe');
    expect(res.text).not.toContain('jane@example.test');
    expect(row).toContain('case.update.succeeded');
    expect(row).toContain('s-1;s-2');
    expect(reader.find).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: tenant.toString(), action: 'case.update.succeeded' }),
      expect.any(Number),
    );
  });

  it('includes actor name and email for audit-admin', async () => {
    const res = await request(createApp({ ...user, roles: [AuditServiceRoles.Reader, AuditServiceRoles.Admin] })).get(
      '/audit/v1/case-service/events/export',
    );
    expect(res.status).toBe(200);
    expect(res.text.split('\r\n')[0]).toContain('actorName,actorEmail');
    expect(res.text).toContain('Jane Doe,jane@example.test');
    expect(reader.find).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: 'case-service' }),
      expect.any(Number),
    );
  });

  it('pages through every event with keyset cursors and records the total', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, i) => makeEvent(i));
    const secondPage = [makeEvent(1000), makeEvent(1001)];
    reader.find.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    const res = await request(createApp()).get('/audit/v1/events/export');

    expect(res.status).toBe(200);
    expect(res.text.trim().split('\r\n')).toHaveLength(1 + 1002);
    expect(reader.find).toHaveBeenCalledTimes(2);
    const last = firstPage[999];
    expect(reader.find).toHaveBeenNthCalledWith(2, expect.anything(), 1000, {
      occurredAt: last.occurred_at,
      id: last.id,
    });
    expect(auditor.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: SelfAuditActions.ExportEvents, resultCount: 1002 }),
    );
  });

  it('neutralizes spreadsheet formulas and quotes special characters', async () => {
    reader.find.mockResolvedValue([makeEvent(1, { resource_name: '=HYPERLINK("x")', actor_id: 'a,b' })]);
    const res = await request(createApp()).get('/audit/v1/events/export');
    expect(res.text).toContain(`"'=HYPERLINK(""x"")"`);
    expect(res.text).toContain('"a,b"');
  });

  it('returns an error response when the first page fails', async () => {
    reader.find.mockRejectedValue(new Error('db down'));
    const res = await request(createApp()).get('/audit/v1/events/export');
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).not.toContain('text/csv');
    expect(auditor.record).not.toHaveBeenCalled();
  });

  it('records a failed export when a later page fails', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, i) => makeEvent(i));
    reader.find.mockResolvedValueOnce(firstPage).mockRejectedValueOnce(new Error('db down'));

    await request(createApp())
      .get('/audit/v1/events/export')
      .then(
        () => undefined,
        () => undefined,
      );

    expect(auditor.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: SelfAuditActions.ExportEvents, resultCount: 1000, status: 'failure' }),
    );
  });

  it('exports the stored event id as id and the client event id as eventId', async () => {
    const res = await request(createApp()).get('/audit/v1/events/export');
    const [header, row] = res.text.trim().split('\r\n');
    expect(header.startsWith('id,eventId,occurredAt')).toBe(true);
    expect(row.startsWith('00000000-0000-4000-8000-000000000001,10000000-0000-4000-8000-000000000001,')).toBe(true);
  });

  it('requires audit-reader', async () => {
    const res = await request(createApp({ ...user, roles: [] })).get('/audit/v1/events/export');
    expect(res.status).toBe(403);
    const namespaced = await request(createApp({ ...user, roles: [] })).get('/audit/v1/case-service/events/export');
    expect(namespaced.status).toBe(403);
    expect(reader.find).not.toHaveBeenCalled();
  });

  it('rejects invalid filters before streaming', async () => {
    const res = await request(createApp()).get('/audit/v1/events/export?severity=bogus');
    expect(res.status).toBe(400);
  });
});
