import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express, RequestHandler } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createkcAdminClient } from '../../keycloak';
import { TenantEntity } from '../models';
import { TenantServiceRoles } from '../roles';
import { createTenantRouter } from './tenant';
import { createTenantV2Router } from './tenantV2';

jest.mock('../../keycloak', () => ({ createkcAdminClient: jest.fn() }));
const createkcAdminClientMock = createkcAdminClient as jest.MockedFunction<typeof createkcAdminClient>;

// Verifies the roles, request validation, and error responses documented in tenant.swagger.yml by sending requests
// through the v1 and v2 routers as mounted in the service, with the real error handler.
describe('tenant routers documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'tenant.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const realmServiceMock = {
    createRealm: jest.fn(),
    deleteRealm: jest.fn(),
    findUserId: jest.fn(),
    deleteUserIdp: jest.fn(),
    checkUserDefaultIdpInCore: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };

  let tenants: TenantEntity[];

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({
      id,
      name: id,
      email: `${id}@test.co`,
      tenantId,
      isCore: false,
      roles,
      token: { iss: 'https://access.adsp.alberta.ca/auth/realms/test-realm' },
      ...overrides,
    }) as unknown as User;
  const core = (id: string, roles: string[]) => user(id, roles, { isCore: true, tenantId: undefined });
  const serviceAdmin = core('service-admin', [TenantServiceRoles.TenantServiceAdmin]);
  const betaTester = core('beta-tester', [TenantServiceRoles.BetaTester]);
  const tenantAdmin = user('tenant-admin', [TenantServiceRoles.TenantAdmin]);
  const plain = user('plain', []);

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.getConfiguration = jest.fn().mockResolvedValue([null, []]);
      next();
    });
    // v1 is mounted behind the jwt strategies only, which reject requests without a valid token.
    const requireToken: RequestHandler = (req, res, next) => (req.user ? next() : res.sendStatus(401));
    app.use(
      '/api/tenant/v1',
      requireToken,
      createTenantRouter({
        tenantRepository: repositoryMock as never,
        realmService: realmServiceMock as never,
        eventService: eventServiceMock,
      }),
    );
    app.use(
      '/api/tenant/v2',
      createTenantV2Router({
        logger: loggerMock,
        tenantRepository: repositoryMock as never,
        realmService: realmServiceMock as never,
        eventService: eventServiceMock,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  const matches = (tenant: TenantEntity, criteria: Record<string, string>) =>
    (!criteria.idEquals || tenant.id === criteria.idEquals) &&
    (!criteria.nameEquals || tenant.name === criteria.nameEquals) &&
    (!criteria.realmEquals || tenant.realm === criteria.realmEquals) &&
    (!criteria.adminEmailEquals || tenant.adminEmail === criteria.adminEmailEquals);

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tenants = [
      new TenantEntity(
        repositoryMock as never,
        {
          id: 'test',
          name: 'Test',
          realm: 'test-realm',
          adminEmail: 'admin@test.co',
          status: 'active',
        } as never,
      ),
      new TenantEntity(
        repositoryMock as never,
        {
          id: 'other',
          name: 'Other',
          realm: 'other-realm',
          adminEmail: 'admin@other.co',
          status: 'active',
        } as never,
      ),
    ];
    repositoryMock.find.mockImplementation((criteria) => Promise.resolve(tenants.filter((t) => matches(t, criteria))));
    repositoryMock.get.mockImplementation((id: string) => Promise.resolve(tenants.find((t) => t.id === id) || null));
    repositoryMock.save.mockImplementation((entity: TenantEntity) => {
      entity.id = entity.id || 'new';
      return Promise.resolve(entity);
    });
    repositoryMock.delete.mockResolvedValue(true);
    realmServiceMock.createRealm.mockResolvedValue(undefined);
    realmServiceMock.deleteRealm.mockResolvedValue(true);
    realmServiceMock.findUserId.mockResolvedValue('user-id');
    realmServiceMock.deleteUserIdp.mockResolvedValue(undefined);
    realmServiceMock.checkUserDefaultIdpInCore.mockResolvedValue(true);
  });

  describe('v1', () => {
    it('responds 401 without a bearer token', async () => {
      const res = await request(createApp(null)).get('/api/tenant/v1/test');
      expect(res.status).toBe(401);
    });

    describe('POST /api/tenant/v1', () => {
      it('allows a core beta-tester to create a tenant, which is provisioned asynchronously', async () => {
        const res = await request(createApp(betaTester)).post('/api/tenant/v1').send({ name: 'New Tenant' });
        expect(res.status).toBe(202);
        expect(res.body).toMatchObject({ name: 'New Tenant', status: 'provisioning' });
      });

      it('rejects a tenant user', async () => {
        const res = await request(createApp(user('tester', [TenantServiceRoles.BetaTester])))
          .post('/api/tenant/v1')
          .send({ name: 'New Tenant' });
        expect(res.status).toBe(401);
      });

      it('responds 400 when name is missing', async () => {
        const res = await request(createApp(betaTester)).post('/api/tenant/v1').send({});
        expect(res.status).toBe(400);
      });
    });

    describe('DELETE /api/tenant/v1', () => {
      it('allows a core tenant-service-admin to delete a tenant by realm', async () => {
        const res = await request(createApp(serviceAdmin)).delete('/api/tenant/v1?realm=other-realm');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ deletedRealm: true, deletedTenant: true, success: true });
      });

      it('rejects a user without the tenant-service-admin role', async () => {
        const res = await request(createApp(betaTester)).delete('/api/tenant/v1?realm=other-realm');
        expect(res.status).toBe(401);
        expect(realmServiceMock.deleteRealm).not.toHaveBeenCalled();
      });

      it('responds 400 when realm is missing', async () => {
        const res = await request(createApp(serviceAdmin)).delete('/api/tenant/v1');
        expect(res.status).toBe(400);
      });

      it('responds 404 for an unknown realm', async () => {
        const res = await request(createApp(serviceAdmin)).delete('/api/tenant/v1?realm=unknown');
        expect(res.status).toBe(404);
      });
    });

    describe('GET /api/tenant/v1/:id', () => {
      it("lets any authenticated user retrieve a tenant, including one that isn't theirs", async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v1/other');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ success: true, tenant: { name: 'Other' } });
      });

      it('responds 404 for an unknown tenant', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v1/unknown');
        expect(res.status).toBe(404);
      });
    });

    describe('GET /api/tenant/v1/realm/roles', () => {
      it('returns the realm roles of the tenant of a tenant-admin', async () => {
        const find = jest.fn().mockResolvedValue([{ name: 'tenant-admin' }]);
        createkcAdminClientMock.mockResolvedValue({ roles: { find } } as never);
        const res = await request(createApp(tenantAdmin)).get('/api/tenant/v1/realm/roles');
        expect(res.status).toBe(200);
        expect(find).toHaveBeenCalledWith({ realm: 'test-realm' });
      });

      it('rejects a user without the tenant-admin role', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v1/realm/roles');
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/tenant/v1/realm/:realm', () => {
      it('lets any authenticated user retrieve a tenant by realm', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v1/realm/other-realm');
        expect(res.status).toBe(200);
        expect(res.body.tenant.name).toBe('Other');
      });

      it('responds 404 for an unknown realm', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v1/realm/unknown');
        expect(res.status).toBe(404);
      });
    });

    describe.each([
      ['email', { email: 'admin@other.co' }, { email: 'unknown@test.co' }],
      ['name', { name: 'Other' }, { name: 'Unknown' }],
    ])('POST /api/tenant/v1/%s', (path, found, notFound) => {
      it('lets any authenticated user find a tenant', async () => {
        const res = await request(createApp(plain)).post(`/api/tenant/v1/${path}`).send(found);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Other');
      });

      it(`responds 400 when ${path} is missing`, async () => {
        const res = await request(createApp(plain)).post(`/api/tenant/v1/${path}`).send({});
        expect(res.status).toBe(400);
      });

      it('responds 404 when there is no matching tenant', async () => {
        const res = await request(createApp(plain)).post(`/api/tenant/v1/${path}`).send(notFound);
        expect(res.status).toBe(404);
      });
    });

    describe('GET /api/tenant/v1/user/id', () => {
      it('looks up the user in the core realm by default for a tenant-admin', async () => {
        const res = await request(createApp(tenantAdmin)).get('/api/tenant/v1/user/id?email=someone@test.co');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ userIdInCore: 'user-id' });
        expect(realmServiceMock.findUserId).toHaveBeenCalledWith('core', 'someone@test.co');
      });

      it('rejects a user without the tenant-admin role', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v1/user/id?email=someone@test.co');
        expect(res.status).toBe(401);
      });

      it('responds 400 when email is missing', async () => {
        const res = await request(createApp(tenantAdmin)).get('/api/tenant/v1/user/id');
        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/tenant/v1/user/default-idp', () => {
      it('checks the default identity provider for a tenant-admin', async () => {
        const res = await request(createApp(tenantAdmin)).get('/api/tenant/v1/user/default-idp?userId=user-id');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ hasDefaultIdpInCore: true });
      });

      it('responds 400 when userId is missing', async () => {
        const res = await request(createApp(tenantAdmin)).get('/api/tenant/v1/user/default-idp');
        expect(res.status).toBe(400);
      });
    });

    describe('DELETE /api/tenant/v1/user/idp', () => {
      it('removes the identity provider link for a tenant-admin', async () => {
        const res = await request(createApp(tenantAdmin)).delete(
          '/api/tenant/v1/user/idp?userId=user-id&realm=test-realm&idpName=core',
        );
        expect(res.status).toBe(200);
        expect(realmServiceMock.deleteUserIdp).toHaveBeenCalledWith('user-id', 'test-realm', 'core');
      });

      it('responds 400 when realm is missing', async () => {
        const res = await request(createApp(tenantAdmin)).delete('/api/tenant/v1/user/idp?userId=user-id');
        expect(res.status).toBe(400);
      });

      it('rejects a user without the tenant-admin role', async () => {
        const res = await request(createApp(plain)).delete('/api/tenant/v1/user/idp?userId=user-id&realm=test-realm');
        expect(res.status).toBe(401);
      });
    });
  });

  describe('v2', () => {
    describe('GET /api/tenant/v2/tenants', () => {
      it('allows an anonymous request with name criteria, without the administrator email', async () => {
        const res = await request(createApp(null)).get('/api/tenant/v2/tenants?name=Other');
        expect(res.status).toBe(200);
        expect(res.body.results).toEqual([expect.objectContaining({ name: 'Other' })]);
        expect(res.body.results[0].adminEmail).toBeUndefined();
      });

      it('allows an anonymous request with realm criteria', async () => {
        const res = await request(createApp(null)).get('/api/tenant/v2/tenants?realm=other-realm');
        expect(res.status).toBe(200);
        expect(res.body.results).toHaveLength(1);
      });

      it('responds 401 for an anonymous request without name or realm criteria', async () => {
        const res = await request(createApp(null)).get('/api/tenant/v2/tenants?adminEmail=admin@other.co');
        expect(res.status).toBe(401);
      });

      it('limits a tenant user to their own tenant', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v2/tenants');
        expect(res.status).toBe(200);
        expect(res.body.results).toEqual([expect.objectContaining({ name: 'Test', adminEmail: 'admin@test.co' })]);
      });

      it('lets a core user find any tenant', async () => {
        const res = await request(createApp(core('core', []))).get('/api/tenant/v2/tenants');
        expect(res.body.results).toHaveLength(2);
      });

      it('only includes active tenants', async () => {
        await request(createApp(null)).get('/api/tenant/v2/tenants?name=Other');
        expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ activeOnly: true }));
      });

      it.each([`name=${'a'.repeat(51)}`, `realm=${'a'.repeat(51)}`, 'adminEmail=not-an-email'])(
        'responds 400 for %s',
        async (query) => {
          const res = await request(createApp(plain)).get(`/api/tenant/v2/tenants?${query}`);
          expect(res.status).toBe(400);
        },
      );
    });

    describe('POST /api/tenant/v2/tenants', () => {
      it('creates a tenant with a new realm for a core beta-tester and responds 202', async () => {
        const res = await request(createApp(betaTester)).post('/api/tenant/v2/tenants').send({ name: 'New Tenant' });
        expect(res.status).toBe(202);
        expect(res.body).toMatchObject({ name: 'New Tenant', status: 'provisioning', adminEmail: betaTester.email });
      });

      it('lets a tenant-service-admin associate an existing realm and responds 200', async () => {
        const res = await request(createApp(serviceAdmin))
          .post('/api/tenant/v2/tenants')
          .send({ name: 'New Tenant', realm: 'existing-realm', adminEmail: 'new@test.co' });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ realm: 'existing-realm', adminEmail: 'new@test.co', status: 'active' });
        expect(realmServiceMock.createRealm).not.toHaveBeenCalled();
      });

      it('responds 400 when a tenant-service-admin sets realm without adminEmail', async () => {
        const res = await request(createApp(serviceAdmin))
          .post('/api/tenant/v2/tenants')
          .send({ name: 'New Tenant', realm: 'existing-realm' });
        expect(res.status).toBe(400);
      });

      it.each([
        ['realm', { realm: 'existing-realm' }],
        ['adminEmail', { adminEmail: 'new@test.co' }],
      ])('rejects a beta-tester setting %s', async (_field, body) => {
        const res = await request(createApp(betaTester))
          .post('/api/tenant/v2/tenants')
          .send({ name: 'New Tenant', ...body });
        expect(res.status).toBe(401);
      });

      it('responds 400 when a beta-tester is already the administrator of a tenant', async () => {
        const existingAdmin = { ...betaTester, email: 'admin@test.co' } as User;
        const res = await request(createApp(existingAdmin)).post('/api/tenant/v2/tenants').send({ name: 'New Tenant' });
        expect(res.status).toBe(400);
      });

      it.each([
        ['name is missing', {}],
        ['name has invalid characters', { name: 'New-Tenant!' }],
        ['name is longer than 50 characters', { name: 'a'.repeat(51) }],
      ])('responds 400 when %s', async (_case, body) => {
        const res = await request(createApp(betaTester)).post('/api/tenant/v2/tenants').send(body);
        expect(res.status).toBe(400);
      });

      it('rejects a tenant user', async () => {
        const res = await request(createApp(user('tester', [TenantServiceRoles.BetaTester])))
          .post('/api/tenant/v2/tenants')
          .send({ name: 'New Tenant' });
        expect(res.status).toBe(401);
      });

      it('responds 401 without a bearer token', async () => {
        const res = await request(createApp(null)).post('/api/tenant/v2/tenants').send({ name: 'New Tenant' });
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/tenant/v2/tenants/:id', () => {
      it('lets a tenant user retrieve their own tenant', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v2/tenants/test');
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Test');
      });

      it('responds 403 when a tenant user retrieves another tenant', async () => {
        const res = await request(createApp(plain)).get('/api/tenant/v2/tenants/other');
        expect(res.status).toBe(403);
      });

      it('lets a core user retrieve any tenant', async () => {
        const res = await request(createApp(core('core', []))).get('/api/tenant/v2/tenants/other');
        expect(res.status).toBe(200);
      });

      it('responds 404 for an unknown tenant', async () => {
        const res = await request(createApp(core('core', []))).get('/api/tenant/v2/tenants/unknown');
        expect(res.status).toBe(404);
      });

      it('responds 401 without a bearer token', async () => {
        const res = await request(createApp(null)).get('/api/tenant/v2/tenants/test');
        expect(res.status).toBe(401);
      });
    });

    describe('PATCH /api/tenant/v2/tenants/:id/name', () => {
      it('allows a core tenant-service-admin', async () => {
        const res = await request(createApp(serviceAdmin))
          .patch('/api/tenant/v2/tenants/other/name')
          .send({ name: 'Renamed' });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Renamed');
      });

      it('rejects a tenant-admin renaming their own tenant', async () => {
        const res = await request(createApp(tenantAdmin))
          .patch('/api/tenant/v2/tenants/test/name')
          .send({ name: 'Renamed' });
        expect(res.status).toBe(401);
      });

      it('responds 400 for a name with invalid characters', async () => {
        const res = await request(createApp(serviceAdmin))
          .patch('/api/tenant/v2/tenants/other/name')
          .send({ name: 'Re:named' });
        expect(res.status).toBe(400);
      });

      it('responds 404 for an unknown tenant', async () => {
        const res = await request(createApp(serviceAdmin))
          .patch('/api/tenant/v2/tenants/unknown/name')
          .send({ name: 'Renamed' });
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/tenant/v2/tenants/:id', () => {
      it('allows a core tenant-service-admin', async () => {
        const res = await request(createApp(serviceAdmin)).delete('/api/tenant/v2/tenants/other');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ deletedRealm: true, deletedTenant: true, success: true });
      });

      it('rejects a user without the tenant-service-admin role', async () => {
        const res = await request(createApp(tenantAdmin)).delete('/api/tenant/v2/tenants/test');
        expect(res.status).toBe(401);
        expect(realmServiceMock.deleteRealm).not.toHaveBeenCalled();
      });

      it('responds 404 for an unknown tenant', async () => {
        const res = await request(createApp(serviceAdmin)).delete('/api/tenant/v2/tenants/unknown');
        expect(res.status).toBe(404);
      });
    });
  });
});
