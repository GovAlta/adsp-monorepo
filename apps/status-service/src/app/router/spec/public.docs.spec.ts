import { adspId } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ServiceStatusRepository } from '../../repository/serviceStatus';
import { createPublicServiceStatusRouter } from '../publicServiceStatus';

// Verifies the responses documented in public.swagger.yml. The real router is mounted at the main.ts path, with the
// service error handler last. The SDK configuration handler that main.ts mounts on /public_status is replaced by a
// stub of req.getConfiguration.
describe('public status router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61e9adcc9423490012a9ae46`;
  const documented = createDocumentedResponseRecorder(join(__dirname, '..', 'public.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const tenantServiceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const serviceStatusRepositoryMock = { find: jest.fn() };
  const getConfigurationMock = jest.fn();

  function createApp(): Express {
    const expressApp = express();
    expressApp.use(documented.middleware);
    expressApp.use((req, _res, next) => {
      req.getConfiguration = getConfigurationMock;
      next();
    });
    expressApp.use(
      '/public_status/v1',
      createPublicServiceStatusRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock,
        serviceStatusRepository: serviceStatusRepositoryMock as unknown as ServiceStatusRepository,
      }),
    );
    expressApp.use(createErrorHandler(loggerMock));
    return expressApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    tenantServiceMock.getTenants.mockResolvedValue([{ id: tenantId, name: 'My-Tenant', realm: 'my-tenant' }]);
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /public_status/v1/applications/{tenant}', () => {
    it('retrieves the applications of the tenant', async () => {
      getConfigurationMock.mockResolvedValueOnce({
        'my-application': {
          appKey: 'my-application',
          name: 'My Application',
          url: 'https://my-application.alberta.ca/health',
          monitorOnly: false,
        },
      });
      serviceStatusRepositoryMock.find.mockResolvedValueOnce([
        { appKey: 'my-application', status: 'operational', statusTimestamp: 1794326400000 },
      ]);

      const res = await request(createApp()).get('/public_status/v1/applications/my-tenant');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          id: 'my-application',
          status: 'operational',
          lastUpdated: '2026-11-10T16:00:00.000Z',
        }),
      ]);
      expect(getConfigurationMock).toHaveBeenCalledWith(tenantId);
    });

    it('returns 404 when the tenant is not found', async () => {
      const res = await request(createApp()).get('/public_status/v1/applications/other-tenant');

      expect(res.status).toBe(404);
    });
  });
});
