import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import { Express } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import { TenantEntity } from '../models';
import { TenantServiceRoles } from '../roles';
import { createTenantRouter } from './tenant';

jest.mock('../../keycloak', () => ({ createkcAdminClient: jest.fn() }));

describe('createTenantRouter', () => {
  const repositoryMock = { find: jest.fn(), get: jest.fn() };
  const realmServiceMock = { findUserId: jest.fn(), deleteUserIdp: jest.fn() };

  const tenantUser = {
    id: 'admin',
    name: 'admin',
    isCore: false,
    tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/own`,
    roles: [TenantServiceRoles.TenantAdmin],
    token: { iss: 'https://access.test/auth/realms/own-realm' },
  } as unknown as User;
  const coreUser = { ...tenantUser, isCore: true, tenantId: undefined } as unknown as User;

  const tenant = (id: string) =>
    new TenantEntity(repositoryMock as never, { id, name: id, realm: `${id}-realm`, status: 'active' } as never);

  function app(user: User) {
    const result = express();
    result.use(express.json());
    result.use((req, _res, next) => {
      req.user = user;
      next();
    });
    result.use(
      createTenantRouter({
        tenantRepository: repositoryMock as never,
        realmService: realmServiceMock as never,
        eventService: { send: jest.fn() } as never,
        auditService: {} as never,
      }),
    );
    result.use(createErrorHandler({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() } as never));
    return result;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock.find.mockResolvedValue([]);
    realmServiceMock.findUserId.mockResolvedValue('user-id');
    realmServiceMock.deleteUserIdp.mockResolvedValue(undefined);
  });

  it('limits a tenant lookup by name to the own tenant of a tenant user', async () => {
    await request(app(tenantUser)).post('/name').send({ name: 'other' });
    expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ idEquals: 'own', nameEquals: 'other' }));
  });

  it('does not limit a tenant lookup by email for a core user', async () => {
    await request(app(coreUser)).post('/email').send({ email: 'a@test.co' });
    expect(repositoryMock.find).toHaveBeenCalledWith(expect.not.objectContaining({ idEquals: expect.anything() }));
  });

  it('responds 404 to a tenant user for another tenant by ID', async () => {
    repositoryMock.get.mockResolvedValue(tenant('other'));
    const res = await request(app(tenantUser)).get('/other');
    expect(res.status).toBe(404);
  });

  it('returns the own tenant of a tenant user by ID', async () => {
    repositoryMock.get.mockResolvedValue(tenant('own'));
    const res = await request(app(tenantUser)).get('/own');
    expect(res.status).toBe(200);
  });

  it.each(['own-realm', 'core'])('lets a tenant-admin look up a user in realm %s', async (realm) => {
    const res = await request(app(tenantUser)).get(`/user/id?email=a@test.co&realm=${realm}`);
    expect(res.status).toBe(200);
    expect(realmServiceMock.findUserId).toHaveBeenCalledWith(realm, 'a@test.co');
  });

  it('rejects a tenant-admin removing an identity provider link in another realm', async () => {
    const res = await request(app(tenantUser)).delete('/user/idp?userId=u&realm=other-realm');
    expect(res.status).toBe(403);
    expect(realmServiceMock.deleteUserIdp).not.toHaveBeenCalled();
  });

  it('lets a core tenant-admin remove an identity provider link in any realm', async () => {
    const res = await request(app(coreUser)).delete('/user/idp?userId=u&realm=other-realm');
    expect(res.status).toBe(200);
    expect(realmServiceMock.deleteUserIdp).toHaveBeenCalledWith('u', 'other-realm', undefined);
  });

  describe('create tenant', () => {
    const betaTester = { ...coreUser, roles: [TenantServiceRoles.BetaTester] } as unknown as User;

    it('responds 400 to a non-string tenant name', async () => {
      const res = await request(app(betaTester)).post('/').send({ name: 123 });
      expect(res.status).toBe(400);
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });

    it('responds 400 to a tenant name sent only in the query string', async () => {
      const res = await request(app(betaTester)).post('/?name=Test').send({});
      expect(res.status).toBe(400);
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['/name', 'name'],
    ['/email', 'email'],
  ])('rejects an operator object in a tenant lookup on %s', async (path, field) => {
    const res = await request(app(coreUser))
      .post(path)
      .send({ [field]: { $ne: null } });
    expect(res.status).toBe(400);
    expect(repositoryMock.find).not.toHaveBeenCalled();
  });
});

describe('tenant router lookups', () => {
  const tenant = { id: 'tenant-1', name: 'Tenant', realm: 'realm-1', adminEmail: 'admin@test.co' };
  const repositoryMock = { find: jest.fn() };
  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

  function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: 'user', roles: [], isCore: true } as unknown as User;
      next();
    });
    app.use(
      '/',
      createTenantRouter({
        tenantRepository: repositoryMock as never,
        realmService: {} as never,
        eventService: { send: jest.fn() },
        auditService: { audit: jest.fn() } as never,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    repositoryMock.find.mockReset();
    repositoryMock.find.mockResolvedValue([tenant]);
  });

  it.each([
    ['email', 'admin@test.co', { adminEmailEquals: 'admin@test.co', excludeArchived: true }],
    ['name', 'Tenant', { nameEquals: 'Tenant', excludeArchived: true }],
  ])('finds a tenant by %s with a string value', async (path, value, criteria) => {
    const res = await request(createApp())
      .post(`/${path}`)
      .send({ [path]: value });

    expect(res.status).toBe(200);
    expect(repositoryMock.find).toHaveBeenCalledWith(criteria);
  });

  it.each([
    ['email', { $ne: null }],
    ['email', ''],
    ['name', { $regex: '.*' }],
    ['name', ''],
  ])('responds 400 for %s %j without querying the repository', async (path, value) => {
    const res = await request(createApp())
      .post(`/${path}`)
      .send({ [path]: value });

    expect(res.status).toBe(400);
    expect(repositoryMock.find).not.toHaveBeenCalled();
  });
});
