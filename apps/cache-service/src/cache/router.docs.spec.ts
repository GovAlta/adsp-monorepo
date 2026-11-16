import { AdspId, adspId, ConfigurationService, ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createAnonymousTenantHandler } from '../tenant';
import { CacheServiceConfiguration } from './configuration';
import { applyCacheMiddleware } from './index';
import { ServiceRoles } from './roles';

// Verifies the roles, tenancy, and error responses documented in router.swagger.yml by sending requests through the
// cache router as mounted in the service, with the real error handler.
// Note: the recorder matches each {param} as one path segment, so requests here use single segment resource paths.
describe('cache router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const tenant = { id: tenantId, name: 'My Tenant', realm: 'my-tenant' };
  const fileApiId = 'urn:ads:platform:file-service:v1';
  const accessApiId = 'urn:ads:platform:access-service:v1';
  const documented = createDocumentedResponseRecorder(join(__dirname, 'router.swagger.yml'));

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
  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };
  const cacheProviderMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };
  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  } as unknown as ConfigurationService;
  const queueServiceMock = {
    enqueue: jest.fn(),
    getItems: jest.fn(() => ({ subscribe: jest.fn() })),
    isConnected: jest.fn(),
  };

  const token = {
    azp: 'my-application',
    aud: 'my-application',
    iss: 'https://access.adsp.alberta.ca/auth/realms/my-tenant',
    email_verified: true,
    scope: 'openid',
    bearer: 'eyJhbGciOiJSUzI1NiJ9.test.signature',
  };
  const tenantUser = (roles: string[]) =>
    ({
      id: '0f6c3b2e-5a1d-4f7e-9b8c-2d4e6f8a1b3c',
      name: 'Test User',
      email: 'test.user@gov.ab.ca',
      tenantId,
      isCore: false,
      roles,
      token,
    }) as User;
  const coreUser = (roles: string[]) =>
    ({
      id: 'a3d5f7b9-1c2e-4f6a-8b0d-9e7c5a3b1d2f',
      name: 'Core User',
      email: 'core.user@gov.ab.ca',
      isCore: true,
      roles,
      token,
    }) as User;
  const reader = tenantUser([ServiceRoles.CacheReader]);

  let upstream: Server;
  let upstreamUrl: URL;

  beforeAll(async () => {
    upstream = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: '52269261-45c0-434e-9467-a888f0bcb4b7', filename: 'application-form.pdf' }));
    });
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    upstreamUrl = new URL(`http://127.0.0.1:${(upstream.address() as AddressInfo).port}/file/v1/`);
  });

  afterAll(async () => {
    await new Promise((resolve) => upstream.close(resolve));
  });

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(
      '/cache',
      (req, _res, next) => {
        // Stands in for passport (anonymous when there is no user) and the SDK tenantHandler, which sets the tenant
        // from the token for tenant users, and from tenantId for core users.
        req.user = currentUser;
        try {
          if (currentUser?.isCore && req.query.tenantId) {
            // Like tenantHandler, a tenantId that isn't an ADSP URN fails with AdspIdFormatError (400).
            AdspId.parse(req.query.tenantId as string);
            req.tenant = tenant;
          } else if (currentUser && !currentUser.isCore) {
            req.tenant = tenant;
          }
          next();
        } catch (err) {
          next(err);
        }
      },
      createAnonymousTenantHandler(tenantServiceMock),
      (req, _res, next) => {
        // Stands in for the SDK configurationHandler, with the cache configuration combined as in main.ts.
        req.getServiceConfiguration = jest.fn(
          async () =>
            new CacheServiceConfiguration(
              loggerMock,
              directoryMock as ServiceDirectory,
              tenantServiceMock,
              cacheProviderMock,
              { targets: { [fileApiId]: { ttl: 900 }, [accessApiId]: { ttl: 2592000 } } },
              req.tenant?.id,
            ),
        ) as typeof req.getServiceConfiguration;
        next();
      },
    );
    applyCacheMiddleware(app, {
      logger: loggerMock,
      configurationService: configurationServiceMock,
      queueService: queueServiceMock as never,
    });
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    tenantServiceMock.getTenant.mockResolvedValue(tenant);
    directoryMock.getServiceUrl.mockResolvedValue(upstreamUrl);
    cacheProviderMock.get.mockResolvedValue(null);
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /cache/v1/cache/{target}/{resource}', () => {
    const path = `/cache/v1/cache/${fileApiId}/files`;

    it('returns a cached response to a user with the cache-reader role', async () => {
      cacheProviderMock.get.mockResolvedValueOnce({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        content: Buffer.from(JSON.stringify({ results: [] })),
      });

      const res = await request(createApp(reader)).get(path);

      expect(res.status).toBe(200);
      expect(res.headers['adsp-cache-status']).toBe('HIT');
      expect(res.body).toEqual({ results: [] });
    });

    it('reads through to upstream and caches the response for an anonymous request with tenantId', async () => {
      const res = await request(createApp(null)).get(path).query({ tenantId: tenantId.toString() });

      expect(res.status).toBe(200);
      expect(res.headers['adsp-cache-status']).toBe('MISS');
      expect(res.body).toEqual(expect.objectContaining({ filename: 'application-form.pdf' }));
      expect(tenantServiceMock.getTenant).toHaveBeenCalledWith(tenantId);
      expect(cacheProviderMock.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        900,
        expect.objectContaining({ status: 200 }),
      );
    });

    it('allows a core user with the cache-reader role to set the tenant with tenantId', async () => {
      const res = await request(createApp(coreUser([ServiceRoles.CacheReader])))
        .get(path)
        .query({ tenantId: tenantId.toString() });

      expect(res.status).toBe(200);
    });

    it('returns 400 when there is no tenant context', async () => {
      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Tenant context is required to read through cache.');
    });

    it('returns 400 for a core user with a tenantId that is not an ADSP URN', async () => {
      const res = await request(createApp(coreUser([ServiceRoles.CacheReader])))
        .get(path)
        .query({ tenantId: 'my-tenant' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the client does not accept gzip encoding', async () => {
      const res = await request(createApp(reader)).get(path).set('Accept-Encoding', 'identity');

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('client must accept gzip encoding.');
    });

    it('returns 400 for an access service path outside the tenant realm', async () => {
      const res = await request(createApp(reader)).get(`/cache/v1/cache/${accessApiId}/other-realm`);

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Cannot request path for realm not matching the tenant context.');
    });

    it('returns 401 for an anonymous request to the access service target', async () => {
      const res = await request(createApp(null))
        .get(`/cache/v1/cache/${accessApiId}/my-tenant`)
        .query({ tenantId: tenantId.toString() });

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without the cache-reader role', async () => {
      const res = await request(createApp(tenantUser([]))).get(path);

      expect(res.status).toBe(403);
    });

    it('returns 403 for a core user without the cache-reader role', async () => {
      const res = await request(createApp(coreUser([])))
        .get(path)
        .query({ tenantId: tenantId.toString() });

      expect(res.status).toBe(403);
    });

    it('returns 404 for a target not configured for the tenant', async () => {
      const res = await request(createApp(reader)).get('/cache/v1/cache/urn:ads:platform:pdf-service:v1/jobs');

      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toBe("cache target with ID 'urn:ads:platform:pdf-service:v1' could not be found.");
    });
  });
});
