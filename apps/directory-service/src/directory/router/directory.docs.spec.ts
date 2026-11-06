import { adspId, AuditService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ServiceRoles } from '../roles';
import { createDirectoryRouter } from './directory';

// Verifies the responses documented in directory.swagger.yml by sending requests through the directory router as
// mounted in the service, with the real error handler.
describe('directory router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'directory.swagger.yml'));

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
  const repositoryMock = {
    find: jest.fn(),
    getDirectories: jest.fn(),
    exists: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const auditServiceMock = {
    record: jest.fn().mockResolvedValue({ status: 'recorded' }),
    flush: jest.fn(),
  };

  const tenant = { id: tenantId, name: 'Test Tenant', realm: 'test' };
  const user = (roles: string[]) => ({ id: 'tester', name: 'tester', tenantId, isCore: false, roles }) as User;

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      next();
    });
    app.use(
      '/directory/v2',
      createDirectoryRouter({
        logger: loggerMock,
        directoryRepository: repositoryMock as never,
        tenantService: tenantServiceMock,
        eventService: eventServiceMock,
        auditService: auditServiceMock as unknown as AuditService,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /directory/v2/namespaces/{namespace}/services/{service}/apis/{api}', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service/apis/v1';

    it('returns the entry of the service API', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);
      repositoryMock.getDirectories.mockResolvedValueOnce({
        name: 'test-tenant',
        services: [{ service: 'form-service:v1', host: 'https://form.test.co/form/v1' }],
      });

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        namespace: 'test-tenant',
        service: 'form-service:v1',
        url: 'https://form.test.co/form/v1',
        urn: 'urn:ads:test-tenant:form-service:v1',
      });
    });

    it('returns 404 when the API is not in the namespace', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(404);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(404);
    });

    it('returns 400 when the namespace is too long', async () => {
      const res = await request(createApp(null)).get(
        `/directory/v2/namespaces/${'a'.repeat(51)}/services/form-service/apis/v1`,
      );

      expect(res.status).toBe(400);
    });
  });

  describe('POST /directory/v2/namespaces', () => {
    it('creates the namespace of the tenant', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);
      repositoryMock.getDirectories.mockResolvedValueOnce(null);

      const res = await request(createApp(user([ServiceRoles.DirectoryAdmin]))).post('/directory/v2/namespaces');

      expect(res.status).toBe(201);
      expect(repositoryMock.update).toHaveBeenCalledWith({ name: 'test-tenant', services: [] });
      expect(auditServiceMock.record).toHaveBeenCalled();
    });

    it('returns 400 when the namespace already exists', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(user([ServiceRoles.DirectoryAdmin]))).post('/directory/v2/namespaces');

      expect(res.status).toBe(400);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);

      const res = await request(createApp(user([]))).post('/directory/v2/namespaces');

      expect(res.status).toBe(403);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
