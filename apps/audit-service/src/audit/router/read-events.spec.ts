import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { CatalogService, RetentionService } from '../model';
import { AuditServiceRoles } from '../roles';
import { EventReader, StoredEvent } from '../types';
import { createAuditRouter } from './index';
import { serializeEvent } from './read-events';

const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`;
const eventId = '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11';

const stored: StoredEvent = {
  id: eventId,
  event_id: '6a1d1f8e-5d8c-4f6f-9a52-7c2d1f0e4b22',
  tenant_id: tenantA.toString(),
  namespace: 'case-service',
  written_by: 'urn:ads:platform:case-service',
  occurred_at: new Date('2026-10-01T10:00:00Z'),
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
  actor_roles: ['case-worker'],
  resource_type: 'case',
  resource_id: 'c-1',
  resource_name: null,
  scope_ids: ['s-1'],
  correlation_id: null,
  session_id: null,
  change_set_before: null,
  change_set_after: { a: 1 },
  metadata: {},
  retention_class: 'compliance',
  retention_until: new Date('2033-10-01T10:00:00Z'),
};

describe('serializeEvent', () => {
  it('omits tenant_id', () => {
    const result = serializeEvent(stored);
    expect(JSON.stringify(result)).not.toContain(tenantA.toString());
    expect(result).not.toHaveProperty('tenant_id');
  });

  it('keeps actor name and email by default', () => {
    expect(serializeEvent(stored).actor).toMatchObject({ name: 'Jane Doe', email: 'jane@example.test' });
  });

  it('can redact actor name and email', () => {
    const { actor } = serializeEvent(stored, { redactActor: true });
    expect(actor).toEqual({ id: 'user-1', type: 'user', roles: ['case-worker'] });
  });
});

describe('read events', () => {
  const reader: jest.Mocked<EventReader> = { find: jest.fn(), get: jest.fn() };
  const user: User = {
    id: 'reader',
    name: 'Reader',
    email: 'reader@example.test',
    isCore: false,
    roles: [AuditServiceRoles.Reader],
    tenantId: tenantA,
    token: { azp: 'ui', aud: 'audit-service', iss: 'tenant-issuer', bearer: 'test', email_verified: true },
  };

  function createApp(caller: User | null = user, withReader = true) {
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
        reader: withReader ? reader : undefined,
      }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    reader.find.mockResolvedValue([stored]);
    reader.get.mockResolvedValue(stored);
  });

  it('lists namespace events for the caller tenant with the Results envelope', async () => {
    const res = await request(createApp()).get('/audit/v1/case-service/events?top=1');
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0]).not.toHaveProperty('tenant_id');
    expect(res.body.page.size).toBe(1);
    expect(Buffer.from(res.body.page.next, 'base64').toString()).toBe('1');
    expect(reader.find).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: tenantA.toString(), namespace: 'case-service' }),
      1,
      0,
    );
  });

  it('applies after cursor and omits next on a short page', async () => {
    const after = Buffer.from('20').toString('base64');
    const res = await request(createApp()).get(`/audit/v1/case-service/events?top=5&after=${after}`);
    expect(res.status).toBe(200);
    expect(reader.find).toHaveBeenCalledWith(expect.anything(), 5, 20);
    expect(res.body.page.next).toBeUndefined();
  });

  it('passes combined filters through', async () => {
    const res = await request(createApp()).get(
      '/audit/v1/case-service/events?actor=user-1&resourceType=case&resourceId=c-1&action=case.update.succeeded&status=success&category=administrative&scope=s-1&occurredFrom=2026-10-01T00:00:00Z&occurredTo=2026-10-02T00:00:00Z',
    );
    expect(res.status).toBe(200);
    expect(reader.find).toHaveBeenCalledWith(
      {
        tenantId: tenantA.toString(),
        namespace: 'case-service',
        actor: 'user-1',
        resourceType: 'case',
        resourceId: 'c-1',
        action: 'case.update.succeeded',
        status: 'success',
        category: 'administrative',
        scope: 's-1',
        occurredFrom: new Date('2026-10-01T00:00:00Z'),
        occurredTo: new Date('2026-10-02T00:00:00Z'),
      },
      10,
      0,
    );
  });

  it('lists across namespaces without a namespace criterion', async () => {
    const res = await request(createApp()).get('/audit/v1/events');
    expect(res.status).toBe(200);
    expect(reader.find.mock.calls[0][0].namespace).toBeUndefined();
    expect(reader.find.mock.calls[0][0].tenantId).toBe(tenantA.toString());
  });

  it.each([
    'top=0',
    'top=5001',
    'after=abc',
    'status=bogus',
    'category=bogus',
    'occurredFrom=yesterday',
    'occurredFrom=2026-10-02T00:00:00Z&occurredTo=2026-10-01T00:00:00Z',
    'status[]=success',
    'status=success&status=failure',
    'category[]=administrative',
    'top[]=5',
    'after[]=MjA=',
    'actor[]=user-1',
    'occurredFrom[]=2026-10-01T00:00:00Z',
    'occurredTo[]=2026-10-01T00:00:00Z',
    'occurredFrom=2026-W42',
    'occurredFrom=2026-274',
    'occurredFrom=2026-02-30',
    'occurredTo=2026-13-01T00:00:00Z',
    `after=${Buffer.from('9'.repeat(400)).toString('base64')}`,
    `after=${Buffer.from('-5').toString('base64')}`,
    `after=${Buffer.from('1.5e3').toString('base64')}`,
  ])('rejects invalid query %s', async (qs) => {
    const res = await request(createApp()).get(`/audit/v1/events?${qs}`);
    expect(res.status).toBe(400);
    expect(reader.find).not.toHaveBeenCalled();
  });

  it('requires audit-reader', async () => {
    const res = await request(createApp({ ...user, roles: [] })).get('/audit/v1/case-service/events');
    expect(res.status).toBe(403);
    const one = await request(createApp({ ...user, roles: [] })).get(`/audit/v1/case-service/events/${eventId}`);
    expect(one.status).toBe(403);
    const all = await request(createApp({ ...user, roles: [] })).get('/audit/v1/events');
    expect(all.status).toBe(403);
  });

  it('returns 503 when storage is not configured', async () => {
    const res = await request(createApp(user, false)).get('/audit/v1/events');
    expect(res.status).toBe(503);
  });

  it('returns a single event by id', async () => {
    const res = await request(createApp()).get(`/audit/v1/case-service/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventId);
    expect(res.body).not.toHaveProperty('tenant_id');
    expect(reader.get).toHaveBeenCalledWith(tenantA.toString(), 'case-service', eventId);
  });

  it('returns 404 for a missing event or one from another tenant', async () => {
    reader.get.mockResolvedValueOnce(null);
    expect((await request(createApp()).get(`/audit/v1/case-service/events/${eventId}`)).status).toBe(404);
    reader.get.mockResolvedValueOnce({ ...stored, tenant_id: tenantB.toString() });
    expect((await request(createApp()).get(`/audit/v1/case-service/events/${eventId}`)).status).toBe(404);
  });

  it('rejects a non-uuid id', async () => {
    const res = await request(createApp()).get('/audit/v1/case-service/events/not-a-uuid');
    expect(res.status).toBe(400);
  });
});
