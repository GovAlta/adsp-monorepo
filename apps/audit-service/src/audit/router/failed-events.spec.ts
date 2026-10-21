import { AdspId, adspId, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createErrorHandler,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { CatalogService, FailedEventService, RetentionService } from '../model';
import { AuditServiceRoles } from '../roles';
import { assertTenantContext, createAuditRouter, validateTenantContext } from './index';
import { encodeKeysetCursor } from '../utils/keyset-cursor';

describe('failed-event administration routes', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenant = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const id = '54862935-e55b-4bc4-8cd0-9e64b193bbd2';
  const basePath = '/audit/v1/failed-events';
  const user: User = {
    id: 'audit-administrator',
    name: 'Administrator',
    email: 'admin@example.test',
    tenantId: tenant,
    isCore: false,
    roles: [AuditServiceRoles.Admin],
    token: { azp: 'admin-app', aud: 'audit-service', iss: 'tenant-issuer', bearer: 'test', email_verified: true },
  };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const metrics = { recordParkedEvent: jest.fn(), recordWriteFailure: jest.fn() };
  const preparer = { prepare: jest.fn(), prepareAudit: jest.fn() };
  const service = new FailedEventService(undefined, 'urn:ads:platform:audit-service', metrics, preparer);
  const list = jest.spyOn(service, 'list');
  const replay = jest.spyOn(service, 'replay');

  function createApp(caller: User | null = user, failedEvents: FailedEventService | undefined = service) {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = caller;
      req.isAuthenticated = (): this is Express.AuthenticatedRequest => !!caller;
      next();
    });
    app.use(assertAuthenticatedHandler, validateTenantContext, assertTenantContext);
    app.use((req, _res, next) => {
      const id = caller?.isCore ? req.query.tenantId : caller?.tenantId;
      if (id) req.tenant = { id: AdspId.parse(String(id)), name: 'Case team', realm: 'case-team' };
      next();
    });
    app.use(
      '/audit/v1',
      createAuditRouter({
        catalogs: new CatalogService(configuration, logger),
        retention: new RetentionService(configuration, logger),
        logger,
        failedEvents,
      }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    list.mockResolvedValue({ results: [], page: { after: undefined, size: 0 } });
  });

  describe.each([
    { method: 'get' as const, path: basePath },
    { method: 'post' as const, path: `${basePath}/${id}/replay` },
  ])('$method $path', ({ method, path }) => {
    it('requires authentication', async () => {
      await request(createApp(null))[method](path).expect(401);
    });

    it.each([AuditServiceRoles.Reader, AuditServiceRoles.Writer])('refuses %s without audit-admin', async (role) => {
      await request(createApp({ ...user, roles: [role] }))
        [method](path)
        .expect(403);

      expect(list).not.toHaveBeenCalled();
      expect(replay).not.toHaveBeenCalled();
    });

    it('refuses a tenant override', async () => {
      await request(createApp())
        [method](path)
        .query({ tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/payment-team' })
        .expect(403);
    });

    it('requires a resolved tenant for Core administrators', async () => {
      await request(createApp({ ...user, isCore: true, tenantId: undefined }))
        [method](path)
        .expect(400);
    });
  });

  it('lists with the caller tenant and default page size', async () => {
    await request(createApp()).get(basePath).expect(200);

    expect(list).toHaveBeenCalledWith(tenant.toString(), 20, undefined);
  });

  it('passes explicit pagination', async () => {
    const after = encodeKeysetCursor(new Date('2026-10-01T00:00:00Z'), '54862935-e55b-4bc4-8cd0-9e64b193bbd2');
    await request(createApp()).get(basePath).query({ top: 100, after }).expect(200);

    expect(list).toHaveBeenCalledWith(tenant.toString(), 100, after);
  });

  it('allows Core administrators with an explicit tenant', async () => {
    await request(createApp({ ...user, isCore: true, tenantId: undefined }))
      .get(basePath)
      .query({ tenantId: tenant.toString() })
      .expect(200);

    expect(list).toHaveBeenCalledWith(tenant.toString(), 20, undefined);
  });

  it.each(['0', '-1', '101', '1.5', 'abc', '', ['1', '2']])('rejects invalid top %s', async (top) => {
    await request(createApp()).get(basePath).query({ top }).expect(400);

    expect(list).not.toHaveBeenCalled();
  });

  it.each(['', 'not-base64', 'MjA=', 'LTE=', ['MA==', 'MQ==']])('rejects invalid after %s', async (after) => {
    await request(createApp()).get(basePath).query({ after }).expect(400);

    expect(list).not.toHaveBeenCalled();
  });

  it('rejects invalid replay IDs', async () => {
    await request(createApp()).post(`${basePath}/not-a-uuid/replay`).expect(400);

    expect(replay).not.toHaveBeenCalled();
  });

  it('uses the authenticated administrator rather than request body identity', async () => {
    await request(createApp())
      .post(`${basePath}/${id}/replay`)
      .send({ actor: { id: 'forged-actor' }, written_by: 'forged-writer' })
      .expect(200);

    expect(replay).toHaveBeenCalledWith(tenant.toString(), id, user);
  });

  it('returns not found for an unknown or other-tenant event', async () => {
    replay.mockRejectedValue(new NotFoundError('failed audit event', id));

    await request(createApp()).post(`${basePath}/${id}/replay`).expect(404);
  });

  it('returns conflict for closed events', async () => {
    replay.mockRejectedValue(new InvalidOperationError('Only open events can be replayed.', { statusCode: 409 }));

    await request(createApp()).post(`${basePath}/${id}/replay`).expect(409);
  });

  it('returns retryable unavailability for repository failures', async () => {
    list.mockRejectedValue(new Error('Database unavailable'));

    await request(createApp()).get(basePath).expect('Retry-After', '1').expect(503);
  });

  it('does not return an empty success when no repository is connected', async () => {
    const unavailable = new FailedEventService(undefined, 'urn:ads:platform:audit-service', metrics, preparer);

    await request(createApp(user, unavailable)).get(basePath).expect('Retry-After', '1').expect(503);
  });
});
