import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, InvalidValueError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { Tenant, TenantEntity } from '../models';
import { TenantServiceRoles } from '../roles';
import { RealmService } from '../services/realm';
import { createTenant, createTenantV2Router, deleteTenant, getTenant, getTenants } from './tenantV2';

describe('createTenantV2Router', () => {
  const repositoryMock = {
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    get: jest.fn(),
  };

  const realmServiceMock = {
    createRealm: jest.fn(),
    deleteRealm: jest.fn(),
  };

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const eventServiceMock = {
    send: jest.fn(),
  };

  const tenant: Tenant = {
    id: 'test',
    name: 'Test',
    realm: 'test-realm',
    adminEmail: 'tester@test.co',
  };

  beforeEach(() => {
    repositoryMock.find.mockReset();
    repositoryMock.get.mockReset();
    repositoryMock.save.mockReset();
    repositoryMock.delete.mockReset();

    realmServiceMock.createRealm.mockReset();
    realmServiceMock.deleteRealm.mockReset();

    eventServiceMock.send.mockReset();
  });

  it('can create router', () => {
    const router = createTenantV2Router({
      logger: loggerMock,
      tenantRepository: repositoryMock,
      realmService: realmServiceMock as RealmService,
      eventService: eventServiceMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getTenants', () => {
    it('can create handler', () => {
      const handler = getTenants(loggerMock, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tenants', async () => {
      const req = {
        query: {},
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` }),
          ]),
          page: expect.objectContaining({ size: 1 }),
        })
      );
    });

    it('can get tenants with criteria', async () => {
      const req = {
        query: {
          name: 'tenant-a',
          realm: 'tenant-a-realm',
          adminEmail: 'test-admin@gov.ab.ca',
        },
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'test-admin@gov.ab.ca',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          nameEquals: req.query.name,
          realmEquals: req.query.realm,
          adminEmailEquals: req.query.adminEmail,
        })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` }),
          ]),
          page: expect.objectContaining({ size: 1 }),
        })
      );
    });

    it('can get own tenant', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-a`;
      const req = {
        query: {},
        user: { isCore: false, tenantId },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` }),
          ]),
          page: expect.objectContaining({ size: 1 }),
        })
      );
    });

    it('can filter other tenant', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-321`;
      const req = {
        query: {},
        user: { isCore: false, tenantId },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      const tenant = {
        id: 'tenant-123',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([]),
          page: expect.objectContaining({ size: 0 }),
        })
      );
    });

    it('can call next for error', async () => {
      const req = {
        query: {},
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      repositoryMock.find.mockRejectedValueOnce(new Error('oh noes!'));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getTenant', () => {
    it('can create handler', () => {
      const handler = getTenant(loggerMock, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tenant', async () => {
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(loggerMock, repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.get.mockResolvedValueOnce(tenant);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` })
      );
    });

    it('can get own tenant', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-a`;
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: false, tenantId },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(loggerMock, repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.get.mockResolvedValueOnce(tenant);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` })
      );
    });

    it('can throw unauthorized for not own tenant', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-321`;
      const req = {
        params: { id: 'tenant-123' },
        user: { isCore: false, tenantId },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(loggerMock, repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.get.mockResolvedValueOnce(tenant);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can call next with error', async () => {
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(loggerMock, repositoryMock);

      repositoryMock.get.mockRejectedValueOnce(new Error('oh noes!'));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteTenant', () => {
    it('can create handler', () => {
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete tenant', async () => {
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock);

      const entity = new TenantEntity(repositoryMock, tenant);
      repositoryMock.get.mockResolvedValueOnce(entity);
      repositoryMock.delete.mockResolvedValueOnce(true);
      realmServiceMock.deleteRealm.mockResolvedValueOnce(true);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(repositoryMock.delete).toHaveBeenCalledWith(entity.id);
      expect(realmServiceMock.deleteRealm).toHaveBeenCalledWith(expect.objectContaining({ realm: tenant.realm }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            tenant: expect.objectContaining({ name: tenant.name, realm: tenant.realm, adminEmail: tenant.adminEmail }),
          }),
        })
      );
    });

    it('can call next with not found', async () => {
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock);

      repositoryMock.get.mockResolvedValueOnce(null);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('createTenant', () => {
    it('can create handler', () => {
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create tenant with new realm', async () => {
      const req = {
        body: {
          name: tenant.name,
        },
        user: { isCore: true, roles: [TenantServiceRoles.BetaTester], email: 'beta-tester@test.co' },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);

      req.getConfiguration.mockResolvedValueOnce([[], []]);
      repositoryMock.save.mockResolvedValueOnce(new TenantEntity(repositoryMock, tenant));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` })
      );
    });

    it('can call next with bad request for duplicate tenant name', async () => {
      const req = {
        body: {
          name: tenant.name,
        },
        user: { isCore: true, roles: [TenantServiceRoles.BetaTester] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      repositoryMock.find.mockResolvedValueOnce([new TenantEntity(repositoryMock, tenant)]);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(InvalidValueError));
    });

    it('can call next with invalid operation for admin with existing tenant', async () => {
      const req = {
        body: {
          name: tenant.name,
        },
        user: { isCore: true, roles: [TenantServiceRoles.BetaTester] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([new TenantEntity(repositoryMock, tenant)]);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with unauthorized for beta user specifying realm', async () => {
      const req = {
        body: {
          name: tenant.name,
          realm: tenant.realm,
        },
        user: { isCore: true, roles: [TenantServiceRoles.BetaTester] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedError));
    });

    it('can call next with unauthorized for beta user specifying email', async () => {
      const req = {
        body: {
          name: tenant.name,
          adminEmail: tenant.adminEmail,
        },
        user: { isCore: true, roles: [TenantServiceRoles.BetaTester] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedError));
    });

    it('can create tenant with existing realm', async () => {
      const req = {
        body: {
          name: tenant.name,
          adminEmail: 'tester@test.co',
          realm: 'test-realm',
        },
        user: { isCore: true, roles: [TenantServiceRoles.TenantServiceAdmin] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);

      repositoryMock.save.mockResolvedValueOnce(new TenantEntity(repositoryMock, tenant));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` })
      );
    });

    it('can call next with invalid operation for existing realm without admin email', async () => {
      const req = {
        body: {
          name: tenant.name,
          realm: 'test-realm',
        },
        user: { isCore: true, roles: [TenantServiceRoles.TenantServiceAdmin] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for admin with existing realm', async () => {
      const req = {
        body: {
          name: tenant.name,
          adminEmail: 'tester@test.co',
          realm: 'test-realm',
        },
        user: { isCore: true, roles: [TenantServiceRoles.TenantServiceAdmin] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([new TenantEntity(repositoryMock, tenant)]);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(InvalidOperationError));
    });
  });
});
