import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { AUDIT_SERVICE_CATALOG, CatalogService, RetentionService, SelfAuditActions } from '../model';
import { DEFAULT_RETENTION_CLASSES } from '../model/retention';
import { createAuditRouter } from '../router';
import { AuditServiceRoles } from '../roles';
import { EnrichedEvent, EventOutcome, EventReader, EventSubmitter, StoredEvent } from '../types';
import { SelfAuditor } from './self-audit';

const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
const tenant = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
const serviceId = adspId`urn:ads:platform:audit-service`;
const eventId = '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11';

const stored = { id: eventId, tenant_id: tenant.toString(), namespace: 'case-service' } as StoredEvent;

describe('audit-service catalog', () => {
  it('is returned for any tenant with security retention', async () => {
    const getServiceConfiguration = jest.fn();
    const catalogs = new CatalogService({ getServiceConfiguration } as never, logger);
    await expect(catalogs.getCatalog('audit-service', tenant)).resolves.toBe(AUDIT_SERVICE_CATALOG);
    expect(getServiceConfiguration).not.toHaveBeenCalled();
    for (const definition of Object.values(AUDIT_SERVICE_CATALOG.actions)) {
      expect(definition.retentionClass).toBe('security');
    }
  });

  it('records replay as administrative and every other action as data-access', () => {
    const { actions } = AUDIT_SERVICE_CATALOG;
    expect(actions[SelfAuditActions.ReplayFailedEvents].category).toBe('administrative');
    const others = Object.entries(actions).filter(([name]) => name !== SelfAuditActions.ReplayFailedEvents);
    expect(others).toHaveLength(4);
    others.forEach(([, definition]) => expect(definition.category).toBe('data-access'));
  });
});

describe('self-auditing reads', () => {
  const reader: jest.Mocked<EventReader> = { find: jest.fn(), get: jest.fn() };
  const submitter: jest.Mocked<EventSubmitter> = { submit: jest.fn() };
  const retention = { getClasses: jest.fn() } as unknown as jest.Mocked<RetentionService>;
  const catalogs = new CatalogService({} as never, logger);
  const user: User = {
    id: 'reader-1',
    name: 'Reader',
    email: 'reader@example.test',
    isCore: false,
    roles: [AuditServiceRoles.Reader],
    tenantId: tenant,
    token: { azp: 'ui', aud: 'audit-service', iss: 'tenant-issuer', bearer: 'test', email_verified: true },
  };

  function createApp(withAuditing = true) {
    const app = express();
    app.use((req, _res, next) => {
      req.user = user;
      req.tenant = { id: tenant, name: 'Tenant', realm: 'tenant' };
      req.isAuthenticated = (): this is Express.AuthenticatedRequest => true;
      next();
    });
    app.use(
      '/audit/v1',
      createAuditRouter({
        catalogs,
        retention,
        logger,
        reader,
        submitter: withAuditing ? submitter : undefined,
        serviceId,
      }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  const submitted = (): EnrichedEvent => submitter.submit.mock.calls[0][0][0];

  beforeEach(() => {
    jest.resetAllMocks();
    reader.find.mockResolvedValue([stored, stored]);
    reader.get.mockResolvedValue(stored);
    retention.getClasses.mockResolvedValue(DEFAULT_RETENTION_CLASSES);
    submitter.submit.mockImplementation(async (events) => {
      return new Map<string, EventOutcome>(events.map((event) => [event.id, { status: 'accepted' }]));
    });
  });

  it('records a namespace listing attributed to the reader and written by the service', async () => {
    const res = await request(createApp())
      .get('/audit/v1/case-service/events?top=5&actor=user-1')
      .set('x-correlation-id', 'corr-1');

    expect(res.status).toBe(200);
    expect(submitter.submit).toHaveBeenCalledTimes(1);
    expect(submitted()).toMatchObject({
      tenant_id: tenant.toString(),
      namespace: 'audit-service',
      written_by: serviceId.toString(),
      action: SelfAuditActions.ListNamespaceEvents,
      category: 'data-access',
      actor_id: 'reader-1',
      actor_type: 'user',
      correlation_id: 'corr-1',
      retention_class: 'security',
      metadata: {
        endpoint: 'GET /audit/v1/:namespace/events',
        resultCount: 2,
        filters: { namespace: 'case-service', actor: 'user-1' },
      },
    });
  });

  it('records cross-namespace listing and single event reads', async () => {
    const app = createApp();
    await request(app).get('/audit/v1/events');
    expect(submitted().action).toBe(SelfAuditActions.ListAllEvents);

    submitter.submit.mockClear();
    await request(app).get(`/audit/v1/case-service/events/${eventId}`);
    expect(submitted()).toMatchObject({
      action: SelfAuditActions.ReadEvent,
      metadata: { resultCount: 1, filters: { namespace: 'case-service', id: eventId } },
    });
  });

  it('records one event per paged request', async () => {
    const cursor = Buffer.from('2').toString('base64');
    await request(createApp()).get(`/audit/v1/case-service/events?top=2&after=${cursor}`);
    expect(submitter.submit).toHaveBeenCalledTimes(1);
    expect(submitter.submit.mock.calls[0][0]).toHaveLength(1);
  });

  it('records reads of the audit-service namespace once, without recursing', async () => {
    await request(createApp()).get('/audit/v1/audit-service/events');
    expect(submitter.submit).toHaveBeenCalledTimes(1);
    expect(submitted().namespace).toBe('audit-service');
  });

  it('does not record failed reads', async () => {
    reader.get.mockResolvedValue(null);
    const res = await request(createApp()).get(`/audit/v1/case-service/events/${eventId}`);
    expect(res.status).toBe(404);
    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it('still returns results when the buffer throws', async () => {
    submitter.submit.mockRejectedValue(new Error('buffer stalled'));
    const res = await request(createApp()).get('/audit/v1/case-service/events');
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
  });

  it('serves reads without a submitter, counting the unrecorded read', async () => {
    const res = await request(createApp(false)).get('/audit/v1/case-service/events');
    expect(res.status).toBe(200);
    expect(submitter.submit).not.toHaveBeenCalled();
  });
});

describe('SelfAuditor failures', () => {
  const getClasses = jest.fn();
  const retention = { getClasses } as never;
  const req = {
    tenant: { id: tenant },
    user: { id: 'svc', name: 'service-account-reporter', email: '', roles: [] },
    get: () => undefined,
  } as never;

  it('counts and swallows rejections, and records service accounts as service actors', async () => {
    getClasses.mockResolvedValue(DEFAULT_RETENTION_CLASSES);
    const submit = jest.fn(async (events: EnrichedEvent[]) => {
      return new Map<string, EventOutcome>(
        events.map((event) => [event.id, { status: 'rejected', code: 'storage_failed', reason: 'nope' }]),
      );
    });
    const auditor = new SelfAuditor({
      serviceId,
      catalogs: new CatalogService({} as never, logger),
      retention,
      submitter: { submit },
      logger,
    });
    await expect(
      auditor.record(req, { action: SelfAuditActions.ReadEvent, endpoint: 'GET /x', resultCount: 1 }),
    ).resolves.toBeUndefined();
    expect(auditor.failureCount).toBe(1);
    expect(submit.mock.calls[0][0][0].actor_type).toBe('service');
  });
});
