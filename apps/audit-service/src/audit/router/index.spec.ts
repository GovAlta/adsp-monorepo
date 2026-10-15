import { adspId, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { CatalogService, RetentionService } from '../model';
import { createAuditRouter, assertTenantContext, validateTenantContext } from './index';
import { AuditServiceRoles } from '../roles';

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
  const catalogs = new CatalogService(configuration, logger);
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
    const result = await request(createApp()).get('/audit/v1/case-service/actions').expect(200);

    expect(result.body).toEqual([{ ...definition, name: 'case.update' }]);
  });

  it('allows a reader from another namespace in the same tenant', async () => {
    const caller = { ...user, token: { ...user.token, azp: 'another-service' } };

    await request(createApp(caller)).get('/audit/v1/case-service/actions').expect(200);
  });

  it('rejects unauthenticated requests', async () => {
    await request(createApp(null)).get('/audit/v1/case-service/actions').expect(401);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('rejects callers without audit-reader before accessing catalogs', async () => {
    await request(createApp({ ...user, roles: [] }))
      .get('/audit/v1/case-service/actions')
      .expect(403);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('returns 404 for unregistered namespaces', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    await request(createApp()).get('/audit/v1/case-service/actions').expect(404);
  });

  it('returns an empty collection for a registered empty catalog', async () => {
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'case-service',
      actions: {},
    });

    const result = await request(createApp()).get('/audit/v1/case-service/actions').expect(200);

    expect(result.body).toEqual([]);
  });

  it('rejects a tenant attempting to select another tenant', async () => {
    await request(createApp())
      .get('/audit/v1/case-service/actions')
      .query({ tenantId: tenantB.toString() })
      .expect(403);

    expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
  });

  it('passes the caller tenant to catalog resolution', async () => {
    await request(createApp()).get('/audit/v1/case-service/actions').expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantA);
  });

  it('allows a core reader to query the resolved target tenant', async () => {
    const caller = { ...user, isCore: true, tenantId: undefined };

    await request(createApp(caller))
      .get('/audit/v1/case-service/actions')
      .query({ tenantId: tenantB.toString() })
      .expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantB);
  });

  it.each(['invalid tenant', 'urn:ads:platform:file-service:v1:/files/one'])(
    'rejects invalid tenant ID %s',
    async (tenantId) => {
      await request(createApp({ ...user, isCore: true }))
        .get('/audit/v1/case-service/actions')
        .query({ tenantId })
        .expect(400);
    },
  );

  it.each(['a'.repeat(41), 'case.service'])('rejects invalid namespace %s', async (namespace) => {
    await request(createApp()).get(`/audit/v1/${namespace}/actions`).expect(400);
  });

  it('returns 503 for a propagated SDK failure', async () => {
    configuration.getServiceConfiguration.mockRejectedValue(new Error('Token provider unavailable'));

    const result = await request(createApp()).get('/audit/v1/case-service/actions').expect(503);

    expect(result.body.errorMessage).toContain('temporarily unavailable');
  });
});
