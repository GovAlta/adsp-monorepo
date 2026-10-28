import { adspId, AdspId, AuditActionDefinition, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler, InvalidOperationError } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { AuditStorageUnavailableError } from '../buffer';
import { CatalogService, RateLimitService, RetentionService } from '../model';
import { AuditServiceRoles } from '../roles';
import { EventSubmitter } from '../types';
import { createAuditJsonParser } from '../utils/request-validation';
import { EventRateLimiter } from '../utils/rate-limiter';
import { assertTenantContext, createAuditRouter, validateTenantContext } from './index';

describe('write rate limiting', () => {
  const logger = createLogger({
    levels: { critical: 0, error: 1, warn: 2, info: 3 },
    transports: [new transports.Console({ silent: true })],
  });
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`;
  const writer: User = {
    id: 'platform-writer',
    name: 'Platform writer',
    email: '',
    isCore: true,
    roles: [AuditServiceRoles.Writer],
    token: {
      azp: 'urn:ads:platform:task-service',
      aud: 'urn:ads:platform:audit-service',
      iss: 'core-issuer',
      bearer: 'test',
      email_verified: false,
    },
  };
  const definition: AuditActionDefinition = {
    version: 1,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'standard',
  };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const submitter: jest.Mocked<EventSubmitter> = { submit: jest.fn() };
  const metrics = { recordRateLimited: jest.fn() };
  let now: number;
  let app: express.Express;

  function createApp() {
    const server = express();
    server.use(createAuditJsonParser());
    server.use((req, _res, next) => {
      req.user = writer;
      req.isAuthenticated = (): this is Express.AuthenticatedRequest => true;
      next();
    });
    server.use(assertAuthenticatedHandler, validateTenantContext, assertTenantContext);
    server.use((req, _res, next) => {
      const id = AdspId.parse(req.query.tenantId as string);
      req.tenant = { id, name: 'Audit tenant', realm: 'audit-tenant' };
      next();
    });
    server.use(
      '/audit/v1',
      createAuditRouter({
        catalogs: new CatalogService(configuration, logger),
        retention: new RetentionService(configuration, logger),
        logger,
        submitter,
        rateLimit: {
          limits: new RateLimitService(configuration, logger, { eventsPerSecond: 500, burst: 500 }),
          limiter: new EventRateLimiter(() => now),
          metrics,
          logger,
        },
      }),
    );
    server.use(createErrorHandler(logger));
    return server;
  }

  function events(count: number) {
    return Array.from({ length: count }, () => ({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      action: 'case.update.succeeded',
      status: 'success',
      actor: { id: 'case-worker', type: 'user' },
    }));
  }

  function write(count: number, namespace = 'case-service', tenantId = tenantA) {
    return request(app)
      .post(`/audit/v1/${namespace}/events`)
      .query({ tenantId: tenantId.toString() })
      .send({ events: events(count) });
  }

  beforeEach(() => {
    jest.resetAllMocks();
    now = 1_000_000;
    configuration.getServiceConfiguration.mockImplementation(async (name) =>
      name.startsWith('actions-')
        ? { kind: 'actionCatalog', application: name.slice('actions-'.length), actions: { 'case.update': definition } }
        : null,
    );
    submitter.submit.mockImplementation(
      async (submitted) => new Map(submitted.map(({ id }) => [id, { status: 'accepted' }])),
    );
    app = createApp();
  });

  it('accepts writes within the limit normally', async () => {
    const response = await write(500);

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ accepted: 500, duplicates: 0, rejected: [] });
  });

  it('refuses a write over the limit whole with 429 and Retry-After, storing none of its events', async () => {
    await write(500);
    submitter.submit.mockClear();

    const response = await write(1);

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBe('1');
    expect(submitter.submit).not.toHaveBeenCalled();
  });

  it('counts events rather than requests', async () => {
    expect((await write(499)).status).toBe(202);
    expect((await write(1)).status).toBe(202);

    expect((await write(1)).status).toBe(429);
  });

  it('records rejected requests and events by tenant and namespace', async () => {
    await write(500);

    await write(20);

    expect(metrics.recordRateLimited).toHaveBeenCalledTimes(1);
    expect(metrics.recordRateLimited).toHaveBeenCalledWith(tenantA.toString(), 'case-service', 20);
  });

  it('does not limit another namespace in the same tenant', async () => {
    await write(500, 'case-service');
    expect((await write(1, 'case-service')).status).toBe(429);

    expect((await write(500, 'payment-service')).status).toBe(202);
  });

  it('does not limit another tenant', async () => {
    await write(500, 'case-service', tenantA);
    expect((await write(1, 'case-service', tenantA)).status).toBe(429);

    expect((await write(500, 'case-service', tenantB)).status).toBe(202);
  });

  it('accepts a limited caller again after the window elapses', async () => {
    await write(500);
    const limited = await write(500);

    now += Number(limited.headers['retry-after']) * 1000;

    expect((await write(500)).status).toBe(202);
  });

  it('applies a Core tenant override and the default to other tenants', async () => {
    configuration.getServiceConfiguration.mockImplementation(async (name) => {
      if (name === 'rate-limit') {
        return {
          kind: 'rateLimitSettings',
          tenants: { [tenantB.toString()]: { eventsPerSecond: 1000, burst: 1000 } },
        };
      }
      return name.startsWith('actions-')
        ? { kind: 'actionCatalog', application: name.slice('actions-'.length), actions: { 'case.update': definition } }
        : null;
    });

    expect((await write(500, 'case-service', tenantB)).status).toBe(202);
    expect((await write(500, 'case-service', tenantB)).status).toBe(202);
    expect((await write(500, 'case-service', tenantA)).status).toBe(202);
    expect((await write(500, 'case-service', tenantA)).status).toBe(429);
  });

  it('keeps 429 for rate limiting distinct from 503 for a full buffer', async () => {
    submitter.submit.mockRejectedValueOnce(new AuditStorageUnavailableError('Audit buffer is at capacity.'));
    const full = await write(500);
    const retried = await write(500);
    const limited = await write(1);

    expect([full.status, retried.status, limited.status]).toEqual([503, 202, 429]);
  });

  it('returns the allowance of a request the buffer refuses as too large', async () => {
    submitter.submit.mockRejectedValueOnce(
      new InvalidOperationError('Audit batch exceeds the buffer byte limit.', {
        statusCode: HttpStatusCodes.REQUEST_TOO_LONG,
      }),
    );

    expect((await write(500)).status).toBe(413);
    expect((await write(250)).status).toBe(202);
    expect((await write(250)).status).toBe(202);
  });

  it('keeps the allowance used by a request with per-event rejections', async () => {
    const response = await request(app)
      .post('/audit/v1/case-service/events')
      .query({ tenantId: tenantA.toString() })
      .send({ events: events(500).map((event) => ({ ...event, action: 'case.unknown' })) });

    expect(response.status).toBe(202);
    expect((await write(1)).status).toBe(429);
  });

  it('validates the envelope before consuming allowance', async () => {
    expect((await write(501)).status).toBe(400);

    expect((await write(500)).status).toBe(202);
  });
});
