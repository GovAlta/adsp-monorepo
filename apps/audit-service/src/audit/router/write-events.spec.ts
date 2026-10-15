import { adspId, AuditActionDefinition, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler, InvalidOperationError } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { CatalogService, RetentionService } from '../model';
import { ActionCatalog } from '../configuration';
import { MAX_JSON_FIELD_BYTES } from '../utils/event-validation';
import { createAuditJsonParser, MAX_REQUEST_BYTES } from '../utils/request-validation';
import { AuditServiceRoles } from '../roles';
import { assertTenantContext, createAuditRouter, validateTenantContext } from './index';
import { AuditEvent, EventOutcome, EventSubmitter } from '../types';

describe('POST /audit/v1/:namespace/events', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`;
  const user: User = {
    id: 'case-writer',
    name: 'Case writer',
    email: '',
    isCore: false,
    roles: [AuditServiceRoles.Writer],
    tenantId: tenantA,
    token: {
      azp: 'urn:ads:case-team:case-service',
      aud: 'urn:ads:platform:audit-service',
      iss: 'tenant-issuer',
      bearer: 'test',
      email_verified: false,
    },
  };
  const coreUser: User = {
    ...user,
    isCore: true,
    tenantId: undefined,
    token: { ...user.token, azp: 'urn:ads:platform:task-service' },
  };
  const definition: AuditActionDefinition = {
    version: 2,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'compliance',
    resourceType: 'case',
    captureChangeSet: true,
    metadataSchema: { type: 'object', properties: { reasonCode: { type: 'string' } }, additionalProperties: false },
  };
  const event: AuditEvent = {
    eventId: '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11',
    occurredAt: new Date().toISOString(),
    action: 'case.update.succeeded',
    status: 'success',
    actor: {
      id: 'case-worker',
      type: 'user',
      name: 'Case worker',
      email: 'worker@example.test',
      roles: ['case-worker'],
    },
    resource: { type: 'case', id: 'CASE-1042', name: 'Intake 1042' },
    scopeIds: ['office-calgary'],
    correlationId: 'case-update-trace',
    sessionId: 'case-session',
    metadata: { reasonCode: 'RESOLVED' },
    changeSet: { before: { status: 'open' }, after: { status: 'closed' } },
  };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const submitter: jest.Mocked<EventSubmitter> = { submit: jest.fn() };
  let catalog: ActionCatalog;

  function createApp(caller: User | null = user, storage: EventSubmitter | null = submitter) {
    const app = express();
    app.use(createAuditJsonParser());
    app.use((req, _res, next) => {
      req.user = caller;
      req.isAuthenticated = (): this is Express.AuthenticatedRequest => !!caller;
      next();
    });
    app.use(assertAuthenticatedHandler, validateTenantContext, assertTenantContext);
    app.use((req, _res, next) => {
      const id = caller?.isCore && req.query.tenantId ? tenantB : caller?.tenantId;
      if (id) req.tenant = { id, name: 'Audit tenant', realm: 'audit-tenant' };
      next();
    });
    app.use(
      '/audit/v1',
      createAuditRouter({
        catalogs: new CatalogService(configuration, logger),
        retention: new RetentionService(configuration, logger),
        logger,
        submitter: storage,
      }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    catalog = { kind: 'actionCatalog', application: 'case-service', actions: { 'case.update': definition } };
    configuration.getServiceConfiguration.mockImplementation(async (name) =>
      name === 'actions-case-service' ? catalog : null,
    );
    submitter.submit.mockImplementation(
      async (events) => new Map(events.map(({ id }) => [id, { status: 'accepted' }])),
    );
  });

  it('accepts a writer in its own namespace', async () => {
    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] });

    expect(result.status).toBe(202);
    expect(result.body).toEqual({ accepted: 1, duplicates: 0, rejected: [] });
  });

  it('creates a complete row-ready event with server-owned fields', async () => {
    const forged = {
      ...event,
      id: 'forged',
      tenant_id: tenantB.toString(),
      namespace: 'payment-service',
      written_by: 'another-writer',
      received_at: '2000-01-01',
      action_version: 99,
      category: 'security',
      severity: 'critical',
      retention_class: 'standard',
      retention_until: '2099-01-01',
    };

    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [forged] })
      .expect(202);

    expect(submitter.submit.mock.calls[0][0][0]).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      event_id: event.eventId,
      tenant_id: tenantA.toString(),
      namespace: 'case-service',
      written_by: user.token.azp,
      occurred_at: new Date(event.occurredAt),
      received_at: expect.any(Date),
      action: event.action,
      action_version: 2,
      category: 'administrative',
      status: 'success',
      severity: 'info',
      actor_id: event.actor.id,
      actor_type: 'user',
      actor_name: event.actor.name,
      actor_email: event.actor.email,
      actor_roles: event.actor.roles,
      resource_type: 'case',
      resource_id: 'CASE-1042',
      resource_name: 'Intake 1042',
      scope_ids: event.scopeIds,
      correlation_id: event.correlationId,
      session_id: event.sessionId,
      change_set_before: { status: 'open' },
      change_set_after: { status: 'closed' },
      metadata: event.metadata,
      retention_class: 'compliance',
      retention_until: new Date(Date.parse(event.occurredAt) + 365 * 86400000),
      originalEvent: forged,
    });
  });

  it.each([
    ['unauthenticated', null, 401],
    ['missing role', { ...user, roles: [] }, 403],
    ['Core without role', { ...coreUser, roles: [] }, 403],
    ['another namespace', { ...user, token: { ...user.token, azp: 'urn:ads:case-team:payment-service' } }, 403],
    ['no tenant', { ...user, tenantId: undefined }, 403],
  ])('refuses %s callers before loading configuration', async (_label, caller, status) => {
    await request(createApp(caller))
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(status);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it.each([
    'case-service',
    'urn:ads:platform',
    'urn:ads:platform:case-service:v1',
    'urn:ads:platform::case-service',
    '',
  ])('refuses invalid writer client URN %s even for Core', async (azp) => {
    await request(createApp({ ...coreUser, token: { ...coreUser.token, azp } }))
      .post('/audit/v1/case-service/events')
      .query({ tenantId: tenantB.toString() })
      .send({ events: [event] })
      .expect(403);

    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it('allows Core with the writer role to write another namespace in the named tenant', async () => {
    await request(createApp(coreUser))
      .post('/audit/v1/case-service/events')
      .query({ tenantId: tenantB.toString() })
      .send({ events: [event] })
      .expect(202);

    expect(submitter.submit.mock.calls[0][0][0]).toMatchObject({
      tenant_id: tenantB.toString(),
      namespace: 'case-service',
      written_by: coreUser.token.azp,
    });
    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantB);
  });

  it('requires Core to name a tenant rather than creating a tenantless row', async () => {
    await request(createApp(coreUser))
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(400);

    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it('refuses a tenant selecting a different tenant', async () => {
    await request(createApp())
      .post('/audit/v1/case-service/events')
      .query({ tenantId: tenantB.toString() })
      .send({ events: [event] })
      .expect(403);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it.each(['case.service', 'a'.repeat(41)])('refuses invalid namespace %s', async (namespace) => {
    await request(createApp(coreUser))
      .post(`/audit/v1/${namespace}/events`)
      .query({ tenantId: tenantB.toString() })
      .send({ events: [event] })
      .expect(400);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it.each([
    {},
    [],
    { events: [] },
    { events: Array(501).fill(event) },
    { events: {} },
    { events: null },
    { events: [event], tenantId: tenantB.toString() },
  ])('refuses invalid batch envelopes before any catalog processing', async (payload) => {
    await request(createApp()).post('/audit/v1/case-service/events').send(payload).expect(400);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it('accepts 500 events through a single submit call', async () => {
    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: Array(500).fill(event) })
      .expect(202);

    expect(result.body.accepted).toBe(500);
    expect(submitter.submit).toHaveBeenCalledTimes(1);
    expect(new Set(submitter.submit.mock.calls[0][0].map(({ id }) => id)).size).toBe(500);
  });

  it('accepts a 500-event batch with both JSON fields at their full byte limits', async () => {
    const metadata = {
      reasonCode: 'x'.repeat(MAX_JSON_FIELD_BYTES - Buffer.byteLength(JSON.stringify({ reasonCode: '' }))),
    };
    const changeSet = {
      before: {
        value: 'x'.repeat(MAX_JSON_FIELD_BYTES - Buffer.byteLength(JSON.stringify({ before: { value: '' } }))),
      },
    };
    const payload = { events: Array(500).fill({ ...event, metadata, changeSet }) };

    const result = await request(createApp()).post('/audit/v1/case-service/events').send(payload).expect(202);

    expect(result.body).toEqual({ accepted: 500, duplicates: 0, rejected: [] });
  });

  it('returns a sanitized 400 for malformed JSON', async () => {
    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .set('Content-Type', 'application/json')
      .send('{"events": [private raw data')
      .expect(400);

    expect(result.body.errorMessage).toBe('Malformed JSON request body.');
    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('returns 413 for bodies exceeding the total byte limit', async () => {
    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [{ ...event, metadata: { value: 'a'.repeat(MAX_REQUEST_BYTES) } }] })
      .expect(413);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('accounts for malformed, accepted, duplicate and parked events by input index', async () => {
    submitter.submit.mockImplementation(
      async (events) =>
        new Map<string, EventOutcome>([
          [events[0].id, { status: 'accepted' }],
          [events[1].id, { status: 'duplicate' }],
          [
            events[2].id,
            { status: 'rejected', code: 'storage_failed', reason: 'Durably parked after commit failure.' },
          ],
        ]),
    );

    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [null, event, event, event, { ...event, action: 'case.remove.failed' }] })
      .expect(202);

    expect(result.body).toMatchObject({
      accepted: 1,
      duplicates: 1,
      rejected: [
        { index: 0, code: 'invalid_event', reason: expect.any(String) },
        { index: 3, eventId: event.eventId, code: 'storage_failed' },
        {
          index: 4,
          eventId: event.eventId,
          code: 'unknown_action',
          reason: expect.stringContaining('case.remove.failed'),
        },
      ],
    });
    expect(result.body.accepted + result.body.duplicates + result.body.rejected.length).toBe(5);
  });

  it('reports unregistered actions individually when no catalog exists', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(202);

    expect(result.body.rejected[0]).toMatchObject({
      code: 'unknown_action',
      reason: expect.stringContaining(event.action),
    });
    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it.each(['case.update', 'case.update.succeeded', 'case.update.failed'])(
    'resolves catalog action %s',
    async (action) => {
      await request(createApp())
        .post('/audit/v1/case-service/events')
        .send({ events: [{ ...event, action }] })
        .expect(202);

      expect(submitter.submit.mock.calls[0][0][0].action).toBe(action);
    },
  );

  it('drops even malformed change sets for a non-capturing action without mutating the parked input', async () => {
    catalog.actions['case.update'] = { ...definition, captureChangeSet: false };
    const input = { ...event, changeSet: 'not a captured change set' };

    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [input] })
      .expect(202);

    expect(submitter.submit.mock.calls[0][0][0]).toMatchObject({
      change_set_before: null,
      change_set_after: null,
      originalEvent: input,
    });
  });

  it('rejects only events explicitly declaring a different action version', async () => {
    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event, { ...event, actionVersion: 2 }, { ...event, actionVersion: 1 }] })
      .expect(202);

    expect(result.body).toMatchObject({
      accepted: 2,
      rejected: [{ index: 2, code: 'action_version_mismatch' }],
    });
    expect(submitter.submit.mock.calls[0][0].map(({ action_version }) => action_version)).toEqual([2, 2]);
  });

  it('fills optional nullable and collection columns without copying caller row fields', async () => {
    catalog.actions['case.update'] = { ...definition, resourceType: undefined };
    const minimal = {
      eventId: event.eventId,
      occurredAt: event.occurredAt,
      action: event.action,
      status: event.status,
      actor: { id: event.actor.id, type: event.actor.type },
    };

    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [minimal] })
      .expect(202);

    expect(submitter.submit.mock.calls[0][0][0]).toMatchObject({
      actor_name: null,
      actor_email: null,
      actor_roles: [],
      resource_type: null,
      resource_id: null,
      resource_name: null,
      scope_ids: [],
      session_id: null,
      correlation_id: null,
      metadata: {},
      change_set_before: null,
      change_set_after: null,
    });
  });

  it('normalizes UUID casing for the PostgreSQL duplicate identity', async () => {
    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [{ ...event, eventId: event.eventId.toUpperCase() }] })
      .expect(202);

    expect(submitter.submit.mock.calls[0][0][0].event_id).toBe(event.eventId);
  });

  it('returns retryable 503 rather than claiming success without storage', async () => {
    const result = await request(createApp(user, null))
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(503);

    expect(result.headers['retry-after']).toBe('1');
    expect(result.body.errorMessage).toContain('not configured');
  });

  it('returns per-event rejections without requiring storage when nothing can be submitted', async () => {
    const result = await request(createApp(user, null))
      .post('/audit/v1/case-service/events')
      .send({ events: [null] })
      .expect(202);

    expect(result.body).toMatchObject({ accepted: 0, duplicates: 0, rejected: [{ index: 0 }] });
  });

  it('returns 503 when a configuration error propagates from the SDK', async () => {
    configuration.getServiceConfiguration.mockRejectedValue(new Error('Configuration offline'));

    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(503);

    expect(result.headers['retry-after']).toBe('1');
    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it('returns retryable 503 for buffer backpressure', async () => {
    submitter.submit.mockRejectedValue(new InvalidOperationError('Buffer is full.', { statusCode: 503 }));

    const result = await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(503);

    expect(result.headers['retry-after']).toBe('1');
  });

  it('refuses empty storage rejection reasons instead of returning an unexplained loss', async () => {
    submitter.submit.mockImplementation(
      async (events) =>
        new Map(events.map(({ id }) => [id, { status: 'rejected', code: 'storage_failed', reason: '' }])),
    );

    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(503);
  });

  it('refuses unknown retention classes without submitting other events in the batch', async () => {
    catalog.actions['case.update'] = { ...definition, retentionClass: 'unconfigured-class' };

    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(503);

    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it('keeps concurrent tenant submissions and their outcome attribution separate', async () => {
    const outcomeByTenant: Record<string, EventOutcome> = {
      [tenantA.toString()]: { status: 'accepted' },
      [tenantB.toString()]: { status: 'duplicate' },
    };
    submitter.submit.mockImplementation(
      async (events) => new Map(events.map(({ id, tenant_id }) => [id, outcomeByTenant[tenant_id]])),
    );
    const app = createApp();
    const coreApp = createApp(coreUser);

    const [tenantResult, coreResult] = await Promise.all([
      request(app)
        .post('/audit/v1/case-service/events')
        .send({ events: [event] }),
      request(coreApp)
        .post('/audit/v1/case-service/events')
        .query({ tenantId: tenantB.toString() })
        .send({ events: [event] }),
    ]);

    expect(tenantResult.body).toEqual({ accepted: 1, duplicates: 0, rejected: [] });
    expect(coreResult.body).toEqual({ accepted: 0, duplicates: 1, rejected: [] });
  });

  it.each([
    new Map<string, EventOutcome>(),
    new Map<string, EventOutcome>([['unknown-server-id', { status: 'accepted' }]]),
  ])('refuses to acknowledge incomplete or misattributed submit outcomes', async (outcomes) => {
    submitter.submit.mockResolvedValue(outcomes);

    await request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .expect(503);
  });

  it('waits for submit to finish before returning accepted', async () => {
    let complete: () => void;
    let started: () => void;
    let responded = false;
    const submitting = new Promise<void>((resolve) => {
      started = resolve;
    });
    submitter.submit.mockImplementation(
      (events) =>
        new Promise((resolve) => {
          complete = () => resolve(new Map(events.map(({ id }) => [id, { status: 'accepted' }])));
          started();
        }),
    );

    const response = request(createApp())
      .post('/audit/v1/case-service/events')
      .send({ events: [event] })
      .then((result) => {
        responded = true;
        return result;
      });
    await submitting;
    expect(responded).toBe(false);
    complete();

    expect((await response).status).toBe(202);
  });
});
