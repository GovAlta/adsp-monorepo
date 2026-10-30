import { adspId, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { CatalogApplicationSource, CatalogService, RetentionService } from '../model';
import { createAuditRouter, assertTenantContext, validateTenantContext } from './index';
import { AuditServiceRoles } from '../roles';
import * as authorization from '../utils/authorization';

describe('GET /audit/v1/:namespace/actions', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`;
  const user: User = {
    id: 'case-reader',
    name: 'Case reader',
    email: 'reader@example.test',
    isCore: false,
    roles: [AuditServiceRoles.Reader],
    tenantId: tenantA,
    token: { azp: 'case-service', aud: 'audit-service', iss: 'tenant-issuer', bearer: 'test', email_verified: true },
  };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const source: jest.Mocked<CatalogApplicationSource> = { listApplications: jest.fn() };
  const catalogs = new CatalogService(configuration, logger, source);
  const definition = {
    version: 1,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'compliance',
    resourceType: 'case',
    captureChangeSet: true,
    forwardToSiem: false,
    metadataSchema: { type: 'object', properties: { caseId: { type: 'string' } }, required: ['caseId'] },
  };

  function createApp(caller: User | null = user) {
    const app = express();
    app.use((req, _res, next) => {
      req.user = caller;
      req.isAuthenticated = (): this is Express.AuthenticatedRequest => !!caller;
      next();
    });
    app.use(assertAuthenticatedHandler, validateTenantContext, assertTenantContext);
    app.use((req, _res, next) => {
      const id = caller?.isCore ? tenantB : caller?.tenantId;
      req.tenant = { id, name: 'Catalog tenant', realm: 'catalog-tenant' };
      next();
    });
    app.use(
      '/audit/v1',
      createAuditRouter({ catalogs, retention: new RetentionService(configuration, logger), logger }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'case-service',
      actions: { 'case.update': definition },
    });
  });

  it('returns named definitions with intact metadata schema', async () => {
    const result = await request(createApp()).get('/audit/v1/case-service/actions').expect(HttpStatusCodes.OK);

    expect(result.body).toEqual([{ ...definition, name: 'case.update' }]);
  });

  it('allows a reader from another namespace in the same tenant', async () => {
    const caller = { ...user, token: { ...user.token, azp: 'another-service' } };

    await request(createApp(caller)).get('/audit/v1/case-service/actions').expect(HttpStatusCodes.OK);
  });

  it('rejects unauthenticated requests', async () => {
    await request(createApp(null)).get('/audit/v1/case-service/actions').expect(HttpStatusCodes.UNAUTHORIZED);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('rejects callers without audit-reader before accessing catalogs', async () => {
    await request(createApp({ ...user, roles: [] }))
      .get('/audit/v1/case-service/actions')
      .expect(HttpStatusCodes.FORBIDDEN);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('returns 404 for unregistered namespaces', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    await request(createApp()).get('/audit/v1/case-service/actions').expect(HttpStatusCodes.NOT_FOUND);
  });

  it('returns an empty collection for a registered empty catalog', async () => {
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'case-service',
      actions: {},
    });

    const result = await request(createApp()).get('/audit/v1/case-service/actions').expect(HttpStatusCodes.OK);

    expect(result.body).toEqual([]);
  });

  it('rejects a tenant attempting to select another tenant', async () => {
    await request(createApp())
      .get('/audit/v1/case-service/actions')
      .query({ tenantId: tenantB.toString() })
      .expect(HttpStatusCodes.FORBIDDEN);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('passes the caller tenant to catalog resolution', async () => {
    await request(createApp()).get('/audit/v1/case-service/actions').expect(HttpStatusCodes.OK);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantA);
  });

  it('allows a core reader to query the resolved target tenant', async () => {
    const caller = { ...user, isCore: true, tenantId: undefined };

    await request(createApp(caller))
      .get('/audit/v1/case-service/actions')
      .query({ tenantId: tenantB.toString() })
      .expect(HttpStatusCodes.OK);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantB);
  });

  it('refuses a Core caller without audit-reader even when naming a tenant', async () => {
    const caller = { ...user, isCore: true, tenantId: undefined, roles: [] };

    await request(createApp(caller))
      .get('/audit/v1/case-service/actions')
      .query({ tenantId: tenantB.toString() })
      .expect(HttpStatusCodes.FORBIDDEN);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('declares the required role on every registered audit route', () => {
    const guardFactory = jest.spyOn(authorization, 'requireAuditRole');
    const router = createAuditRouter({ catalogs, retention: new RetentionService(configuration, logger), logger });
    const guards = new Map<express.RequestHandler, AuditServiceRoles>(
      guardFactory.mock.results.map((result, index) => [result.value, guardFactory.mock.calls[index][0]]),
    );
    guardFactory.mockRestore();
    const routes = router.stack.map(({ route }) => ({
      path: route.path,
      roles: route.stack.map(({ handle }) => guards.get(handle)).filter(Boolean),
    }));

    expect(routes).toEqual([
      { path: '/namespaces', roles: [AuditServiceRoles.Reader] },
      { path: '/actions', roles: [AuditServiceRoles.Reader] },
      { path: '/retention', roles: [AuditServiceRoles.Reader] },
      { path: '/:namespace/actions', roles: [AuditServiceRoles.Reader] },
      { path: '/events/export', roles: [AuditServiceRoles.Reader] },
      { path: '/:namespace/events/export', roles: [AuditServiceRoles.Reader] },
      { path: '/events', roles: [AuditServiceRoles.Reader] },
      { path: '/:namespace/events', roles: [AuditServiceRoles.Reader] },
      { path: '/:namespace/events/:id', roles: [AuditServiceRoles.Reader] },
      { path: '/:namespace/events', roles: [AuditServiceRoles.Writer] },
      { path: '/failed-events', roles: [AuditServiceRoles.Admin] },
      { path: '/failed-events/:id/replay', roles: [AuditServiceRoles.Admin] },
    ]);
  });

  describe('GET /audit/v1/retention', () => {
    it('returns configured retention for the tenant and the applications that override it', async () => {
      source.listApplications.mockImplementation(async (tenantId) => (tenantId ? ['case-service'] : []));
      configuration.getServiceConfiguration.mockImplementation(async (name: string) => {
        if (name === 'retention') {
          return { kind: 'retentionSettings', classes: { standard: { days: 120 } } };
        }
        return name === 'retention-case-service'
          ? { kind: 'applicationRetentionSettings', application: 'case-service', classes: { security: { days: 400 } } }
          : name === 'actions-case-service'
          ? { kind: 'actionCatalog', application: 'case-service', actions: { 'case.update': definition } }
          : null;
      });

      const result = await request(createApp()).get('/audit/v1/retention').expect(HttpStatusCodes.OK);

      expect(result.body).toEqual({
        tenant: { standard: { days: 120 } },
        applications: { 'case-service': { security: { days: 400 } } },
      });
    });

    it('rejects callers without audit-reader', async () => {
      await request(createApp({ ...user, roles: [] }))
        .get('/audit/v1/retention')
        .expect(HttpStatusCodes.FORBIDDEN);

      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('GET /audit/v1/actions', () => {
    it('lists tenant and Core catalogs with named actions and the core flag', async () => {
      source.listApplications.mockImplementation(async (tenantId) =>
        tenantId ? ['case-service'] : ['audit-service', 'case-service'],
      );
      configuration.getServiceConfiguration.mockImplementation(async (name: string) => ({
        kind: 'actionCatalog',
        application: name.substring('actions-'.length),
        actions: { 'case.update': definition },
      }));

      const result = await request(createApp()).get('/audit/v1/actions').expect(HttpStatusCodes.OK);

      expect(result.body).toEqual([
        { application: 'audit-service', core: true, actions: [{ ...definition, name: 'case.update' }] },
        { application: 'case-service', core: true, actions: [{ ...definition, name: 'case.update' }] },
      ]);
      expect(source.listApplications).toHaveBeenCalledWith();
      expect(source.listApplications).toHaveBeenCalledWith(tenantA);
    });

    it('marks tenant-only catalogs as not core', async () => {
      source.listApplications.mockImplementation(async (tenantId) => (tenantId ? ['case-service'] : []));

      const result = await request(createApp()).get('/audit/v1/actions').expect(HttpStatusCodes.OK);

      expect(result.body).toMatchObject([{ application: 'case-service', core: false }]);
    });

    it('rejects callers without audit-reader before listing', async () => {
      await request(createApp({ ...user, roles: [] }))
        .get('/audit/v1/actions')
        .expect(HttpStatusCodes.FORBIDDEN);

      expect(source.listApplications).not.toHaveBeenCalled();
    });

    it('rejects a tenant attempting to select another tenant', async () => {
      await request(createApp())
        .get('/audit/v1/actions')
        .query({ tenantId: tenantB.toString() })
        .expect(HttpStatusCodes.FORBIDDEN);

      expect(source.listApplications).not.toHaveBeenCalled();
    });

    it('returns 503 when catalogs cannot be listed', async () => {
      source.listApplications.mockRejectedValue(new Error('Configuration service unavailable'));

      const result = await request(createApp()).get('/audit/v1/actions').expect(HttpStatusCodes.SERVICE_UNAVAILABLE);

      expect(result.body.errorMessage).toContain('temporarily unavailable');
    });
  });

  it.each(['invalid tenant', 'urn:ads:platform:file-service:v1:/files/one'])(
    'rejects invalid tenant ID %s',
    async (tenantId) => {
      await request(createApp({ ...user, isCore: true }))
        .get('/audit/v1/case-service/actions')
        .query({ tenantId })
        .expect(HttpStatusCodes.BAD_REQUEST);
    },
  );

  it.each(['a'.repeat(41), 'case.service'])('rejects invalid namespace %s', async (namespace) => {
    await request(createApp()).get(`/audit/v1/${namespace}/actions`).expect(HttpStatusCodes.BAD_REQUEST);
  });

  it('returns 503 for a propagated SDK failure', async () => {
    configuration.getServiceConfiguration.mockRejectedValue(new Error('Token provider unavailable'));

    const result = await request(createApp())
      .get('/audit/v1/case-service/actions')
      .expect(HttpStatusCodes.SERVICE_UNAVAILABLE);

    expect(result.body.errorMessage).toContain('temporarily unavailable');
  });
});
