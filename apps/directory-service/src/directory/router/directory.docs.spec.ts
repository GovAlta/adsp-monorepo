import { adspId, AuditService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios from 'axios';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ServiceRoles } from '../roles';
import { createDirectoryRouter } from './directory';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

// Verifies the responses documented in directory.swagger.yml by sending requests through the directory router as
// mounted in the service, with the real error handler.
describe('directory router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/other`;
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
  const user = (roles: string[], userTenantId = tenantId) =>
    ({ id: 'tester', name: 'tester', tenantId: userTenantId, isCore: false, roles }) as User;
  const admin = user([ServiceRoles.DirectoryAdmin]);

  const directory = () => ({
    name: 'test-tenant',
    services: [
      { service: 'form-service', host: 'https://form.test.co' },
      { service: 'form-service:v1', host: 'https://form.test.co/form/v1' },
    ],
  });

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
    repositoryMock.getDirectories.mockReset();
    tenantServiceMock.getTenantByName.mockReset();
    tenantServiceMock.getTenantByName.mockResolvedValue(tenant);
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /directory/v2/namespaces/{namespace}/entries', () => {
    const path = '/directory/v2/namespaces/test-tenant/entries';

    it('returns the entries of the namespace to anonymous users', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          namespace: 'test-tenant',
          service: 'form-service',
          url: 'https://form.test.co',
          urn: 'urn:ads:test-tenant:form-service',
        },
        {
          namespace: 'test-tenant',
          service: 'form-service:v1',
          url: 'https://form.test.co/form/v1',
          urn: 'urn:ads:test-tenant:form-service:v1',
        },
      ]);
    });

    it('returns an empty array when the namespace has no directory', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(null);

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 400 when the namespace is too long', async () => {
      const res = await request(createApp(null)).get(`/directory/v2/namespaces/${'a'.repeat(51)}/entries`);

      expect(res.status).toBe(400);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toBe("directory namespace with ID 'test-tenant' could not be found.");
    });
  });

  describe('GET /directory/v2/namespaces/{namespace}/services/{service}/apis', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service/apis';

    it('returns the service entry and its API entries', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(200);
      expect(res.body.service).toMatchObject({ service: 'form-service', urn: 'urn:ads:test-tenant:form-service' });
      expect(res.body.apis).toEqual([expect.objectContaining({ service: 'form-service:v1' })]);
    });

    it('returns 400 when the namespace is too long', async () => {
      const res = await request(createApp(null)).get(
        `/directory/v2/namespaces/${'a'.repeat(51)}/services/form-service/apis`,
      );

      expect(res.status).toBe(400);
    });

    it('returns 404 when the namespace has no entry for the service', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(404);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /directory/v2/namespaces/{namespace}/services/{service}/apis/{api}', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service/apis/v1';

    it('returns the entry of the service API', async () => {
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

      const res = await request(createApp(admin)).post('/directory/v2/namespaces');

      expect(res.status).toBe(201);
      expect(repositoryMock.update).toHaveBeenCalledWith({ name: 'test-tenant', services: [] });
      expect(auditServiceMock.record).toHaveBeenCalled();
    });

    it('returns 400 when the namespace already exists', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(admin)).post('/directory/v2/namespaces');

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

  describe('POST /directory/v2/namespaces/{namespace}/services', () => {
    const path = '/directory/v2/namespaces/test-tenant/services';

    it('adds the service entry', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(null);

      const res = await request(createApp(admin))
        .post(path)
        .send({ service: 'form-service', url: 'https://form.test.co' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ service: 'form-service', host: 'https://form.test.co' });
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(user([])))
        .post(path)
        .send({ service: 'form-service', url: 'https://form.test.co' });

      expect(res.status).toBe(403);
    });

    it('returns 403 for a user of another tenant', async () => {
      const res = await request(createApp(user([ServiceRoles.DirectoryAdmin], otherTenantId)))
        .post(path)
        .send({ service: 'form-service', url: 'https://form.test.co' });

      expect(res.status).toBe(403);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(admin))
        .post(path)
        .send({ service: 'form-service', url: 'https://form.test.co' });

      expect(res.status).toBe(404);
    });

    it('returns 409 when the service entry exists', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(admin))
        .post(path)
        .send({ service: 'form-service', url: 'https://form.test.co' });

      expect(res.status).toBe(409);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /directory/v2/namespaces/{namespace}/services/{service}/apis', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service/apis';

    it('adds the API entry', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] }).mockResolvedValueOnce({
        name: 'test-tenant',
        services: [
          { _id: '64f1c2a3b4c5d6e7f8a9b0c1', service: 'form-service:v2', host: 'https://form.test.co/form/v2' },
        ],
      });

      const res = await request(createApp(admin)).post(path).send({ api: 'v2', url: 'https://form.test.co/form/v2' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ service: 'form-service:v2', host: 'https://form.test.co/form/v2' });
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(null)).post(path).send({ api: 'v2', url: 'https://form.test.co/form/v2' });

      expect(res.status).toBe(403);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).post(path).send({ api: 'v2', url: 'https://form.test.co/form/v2' });

      expect(res.status).toBe(404);
    });

    it('returns 409 when the API entry exists', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(admin)).post(path).send({ api: 'v1', url: 'https://form.test.co/form/v1' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /directory/v2/namespaces/{namespace}/services/{service}', () => {
    it('returns the service entry with its metadata', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({
        name: 'metadata-tenant',
        services: [{ service: 'form-service', host: 'https://form.test.co' }],
      });
      axiosMock.get.mockResolvedValueOnce({
        data: { name: 'Form service', _links: { self: { href: 'https://form.test.co' } } },
      });

      const res = await request(createApp(null)).get('/directory/v2/namespaces/metadata-tenant/services/form-service');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ service: 'form-service', metadata: { name: 'Form service' } });
    });

    it('returns 400 when the service is too long', async () => {
      const res = await request(createApp(null)).get(`/directory/v2/namespaces/test-tenant/services/${'a'.repeat(51)}`);

      expect(res.status).toBe(400);
    });

    it('returns 400 when the service is not in the namespace', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(null)).get('/directory/v2/namespaces/test-tenant/services/unknown-service');

      expect(res.status).toBe(400);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(null)).get('/directory/v2/namespaces/test-tenant/services/form-service');

      expect(res.status).toBe(404);
    });

    it('returns 424 when the metadata cannot be retrieved', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({
        name: 'test-tenant',
        services: [{ service: 'down-service', host: 'https://down.test.co' }],
      });
      axiosMock.get.mockRejectedValueOnce(new Error('timeout'));

      const res = await request(createApp(null)).get('/directory/v2/namespaces/test-tenant/services/down-service');

      expect(res.status).toBe(424);
    });
  });

  describe('PATCH /directory/v2/namespaces/{namespace}/services/{service}', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service';

    it('updates the service URL', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(admin)).patch(path).send({ url: 'https://form2.test.co' });

      expect(res.status).toBe(201);
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it('returns 400 when the service is not in the namespace', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(admin)).patch(path).send({ url: 'https://form2.test.co' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errors: 'form-service does not exist in test-tenant' });
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(user([])))
        .patch(path)
        .send({ url: 'https://form2.test.co' });

      expect(res.status).toBe(403);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).patch(path).send({ url: 'https://form2.test.co' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /directory/v2/namespaces/{namespace}/services/{service}', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service';

    it('deletes the service entry', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(admin)).delete(path);

      expect(res.status).toBe(200);
      expect(repositoryMock.update).toHaveBeenCalledWith({
        name: 'test-tenant',
        services: [{ service: 'form-service:v1', host: 'https://form.test.co/form/v1' }],
      });
    });

    it('returns 400 when the service is not in the namespace', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(admin)).delete(path);

      expect(res.status).toBe(400);
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(user([]))).delete(path);

      expect(res.status).toBe(403);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).delete(path);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /directory/v2/namespaces/{namespace}/services/{service}/apis/{api}', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service/apis/v1';

    it('updates the API URL', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(admin)).patch(path).send({ url: 'https://form2.test.co/form/v1' });

      expect(res.status).toBe(201);
    });

    it('returns 400 when the API is not in the namespace', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({ name: 'test-tenant', services: [] });

      const res = await request(createApp(admin)).patch(path).send({ url: 'https://form2.test.co/form/v1' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errors: 'form-service:v1 does not exist in test-tenant' });
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(user([])))
        .patch(path)
        .send({ url: 'https://form2.test.co/form/v1' });

      expect(res.status).toBe(403);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).patch(path).send({ url: 'https://form2.test.co/form/v1' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /directory/v2/namespaces/{namespace}/services/{service}/apis/{api}', () => {
    const path = '/directory/v2/namespaces/test-tenant/services/form-service/apis/v1';

    it('deletes the API entry', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(directory());

      const res = await request(createApp(admin)).delete(path);

      expect(res.status).toBe(200);
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('returns 400 when the namespace has no directory', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).delete(path);

      expect(res.status).toBe(400);
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(user([]))).delete(path);

      expect(res.status).toBe(403);
    });

    it('returns 404 when the namespace has no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).delete(path);

      expect(res.status).toBe(404);
    });
  });
});
