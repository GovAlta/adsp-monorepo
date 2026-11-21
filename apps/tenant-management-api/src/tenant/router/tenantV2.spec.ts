import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, InvalidValueError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { Tenant, TenantEntity } from '../models';
import { TenantServiceRoles } from '../roles';
import { RealmService } from '../services/realm';
import {
  createTenant,
  createTenantV2Router,
  deleteTenant,
  getTenant,
  getTenants,
  restoreTenant,
  updateTenantName,
} from './tenantV2';

describe('createTenantV2Router', () => {
  const repositoryMock = {
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    get: jest.fn(),
  };

  const realmServiceMock = {
    createRealm: jest.fn(),
    disableRealm: jest.fn(),
    enableRealm: jest.fn(),
    deleteRealm: jest.fn(),
    deleteUserIdp: jest.fn(),
    findUserId: jest.fn(),
    checkUserDefaultIdpInCore: jest.fn(),
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

  const auditServiceMock = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };

  const tenantUrn = 'urn:ads:platform:tenant-service:v2:/tenants/test';
  const tenantAudit = (resource: Record<string, unknown>, details: Record<string, unknown> = {}) =>
    expect.objectContaining({ resource: expect.objectContaining({ type: 'tenant', ...resource }), ...details });
  const tenant: Tenant = {
    id: 'test',
    name: 'Test',
    realm: 'test-realm',
    adminEmail: 'tester@test.co',
  };
  const archivedTenant: Tenant = { ...tenant, status: 'archived', deletedAt: new Date() };
  const purgeUser = { id: 'user-1', name: 'Tester', isCore: true, roles: [TenantServiceRoles.TenantPurge] };
  const adminUser = { id: 'user-1', name: 'Tester', isCore: true, roles: [TenantServiceRoles.TenantServiceAdmin] };

  beforeEach(() => {
    repositoryMock.find.mockReset();
    repositoryMock.get.mockReset();
    repositoryMock.save.mockReset();
    repositoryMock.delete.mockReset();

    realmServiceMock.createRealm.mockReset();
    realmServiceMock.disableRealm.mockReset();
    realmServiceMock.enableRealm.mockReset();
    realmServiceMock.deleteRealm.mockReset();
    realmServiceMock.deleteUserIdp.mockReset();
    realmServiceMock.findUserId.mockReset();
    realmServiceMock.checkUserDefaultIdpInCore.mockReset();
    eventServiceMock.send.mockReset();
    auditServiceMock.record.mockReset();
    auditServiceMock.record.mockResolvedValue({ status: 'recorded', eventId: 'event-1' });
  });

  it('can create router', () => {
    const router = createTenantV2Router({
      logger: loggerMock,
      tenantRepository: repositoryMock,
      realmService: realmServiceMock as RealmService,
      eventService: eventServiceMock,
      auditService: auditServiceMock,
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
        }),
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
        }),
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` }),
          ]),
          page: expect.objectContaining({ size: 1 }),
        }),
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
        }),
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

      repositoryMock.find.mockResolvedValueOnce([]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([]),
          page: expect.objectContaining({ size: 0 }),
        }),
      );
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ idEquals: 'tenant-321' }));
    });

    it('can get archived tenants as tenant-service-admin', async () => {
      const req = { query: { status: 'archived' }, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      repositoryMock.find.mockResolvedValueOnce([new TenantEntity(repositoryMock, archivedTenant)]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ statusEquals: 'archived' }));
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [expect.objectContaining({ status: 'archived', deletedAt: archivedTenant.deletedAt })],
        }),
      );
    });

    it('can reject archived tenants for non-admin', async () => {
      const req = { query: { status: 'archived' }, user: { isCore: true, roles: [] } };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });

    it('can reject archived tenants for anonymous', async () => {
      const req = { query: { status: 'archived' } };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('can get active tenants as tenant-service-admin', async () => {
      const req = { query: { status: 'active' }, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      repositoryMock.find.mockResolvedValueOnce([new TenantEntity(repositoryMock, tenant)]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ statusEquals: 'active' }));
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ results: [expect.objectContaining({ name: tenant.name })] }),
      );
    });

    it('can reject active status filter for non-admin', async () => {
      const req = { query: { status: 'active' }, user: { isCore: true, roles: [] } };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });

    it('can reject active status filter for anonymous', async () => {
      const req = { query: { status: 'active' } };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getTenants(loggerMock, repositoryMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });

    it('can limit default results to active tenants', async () => {
      const req = { query: {}, user: { isCore: true } };
      const res = { send: jest.fn() };
      const handler = getTenants(loggerMock, repositoryMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      await handler(req as unknown as Request, res as unknown as Response, jest.fn());
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ activeOnly: true }));
      expect(repositoryMock.find).toHaveBeenCalledWith(
        expect.not.objectContaining({ statusEquals: expect.anything() }),
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
        expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` }),
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
        expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` }),
      );
    });

    it('can throw not found for not own tenant', async () => {
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

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(repositoryMock.get).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can throw not found for tenant user without tenant id', async () => {
      const req = {
        params: { id: 'tenant-123' },
        user: { isCore: false },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(loggerMock, repositoryMock);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
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

    it('can throw not found for an archived tenant of a tenant user', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const req = { params: { id: 'test' }, user: { isCore: false, tenantId } };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getTenant(loggerMock, repositoryMock);

      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, archivedTenant));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can get an archived tenant as core user', async () => {
      const req = { params: { id: 'test' }, user: { isCore: true } };
      const res = { send: jest.fn() };
      const handler = getTenant(loggerMock, repositoryMock);

      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, archivedTenant));
      await handler(req as unknown as Request, res as unknown as Response, jest.fn());
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' }));
    });

    it('can throw not found for a deleted/unknown tenant', async () => {
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(loggerMock, repositoryMock);

      repositoryMock.get.mockResolvedValueOnce(null);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('deleteTenant', () => {
    it('can create handler', () => {
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can archive tenant', async () => {
      const req = { params: { id: 'tenant-a' }, query: {}, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      const entity = new TenantEntity(repositoryMock, tenant);
      repositoryMock.get.mockResolvedValueOnce(entity);
      repositoryMock.save.mockImplementationOnce((e) => Promise.resolve(e));
      realmServiceMock.disableRealm.mockResolvedValueOnce(undefined);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(realmServiceMock.disableRealm).toHaveBeenCalledWith(expect.objectContaining({ realm: tenant.realm }));
      expect(realmServiceMock.deleteRealm).not.toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'archived', deletedAt: expect.any(Date) }),
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ id: tenantUrn, status: 'archived', deletedAt: expect.any(Date) }),
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'tenant-archived' }));
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.archived' }),
        tenantAudit({ id: tenantUrn, name: tenant.name }),
      );
    });

    it('can leave an archived tenant unchanged when archived again', async () => {
      const req = { params: { id: 'tenant-a' }, query: {}, user: adminUser };
      const res = { send: jest.fn() };
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, archivedTenant));
      await handler(req as unknown as Request, res as unknown as Response, jest.fn());

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' }));
      expect(realmServiceMock.disableRealm).not.toHaveBeenCalled();
      expect(repositoryMock.save).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('can reject archive of a provisioning tenant', async () => {
      const req = { params: { id: 'tenant-a' }, query: {}, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, { ...tenant, status: 'provisioning' }));
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(realmServiceMock.disableRealm).not.toHaveBeenCalled();
    });

    it('can not archive when the realm cannot be disabled', async () => {
      const req = { params: { id: 'tenant-a' }, query: {}, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      const error = new Error('Keycloak unavailable');
      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, tenant));
      realmServiceMock.disableRealm.mockRejectedValueOnce(error);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(repositoryMock.save).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('can reject purge without the tenant-purge role', async () => {
      const req = { params: { id: 'tenant-a' }, query: { purge: 'true' }, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(repositoryMock.get).not.toHaveBeenCalled();
      expect(realmServiceMock.deleteRealm).not.toHaveBeenCalled();
    });

    it('can reject purge of a tenant that is not archived', async () => {
      const req = { params: { id: 'tenant-a' }, query: { purge: 'true' }, user: purgeUser };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, tenant));
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(realmServiceMock.deleteRealm).not.toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it('can purge an archived tenant', async () => {
      const req = {
        params: { id: 'tenant-a' },
        query: { purge: 'true' },
        user: purgeUser,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      const entity = new TenantEntity(repositoryMock, archivedTenant);
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
        }),
      );
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.deleted', severity: 'critical', retentionClass: 'compliance' }),
        tenantAudit(
          { id: tenantUrn, name: tenant.name },
          { metadata: { tenantName: tenant.name, realm: tenant.realm } },
        ),
      );
    });

    it('can record deletion before the realm and tenant are removed', async () => {
      const req = {
        params: { id: 'tenant-a' },
        query: { purge: 'true' },
        user: purgeUser,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      const entity = new TenantEntity(repositoryMock, archivedTenant);
      repositoryMock.get.mockResolvedValueOnce(entity);
      repositoryMock.delete.mockResolvedValueOnce(true);
      realmServiceMock.deleteRealm.mockResolvedValueOnce(true);
      await handler(req as unknown as Request, res as unknown as Response, next);

      const [recordOrder] = auditServiceMock.record.mock.invocationCallOrder;
      expect(recordOrder).toBeLessThan(realmServiceMock.deleteRealm.mock.invocationCallOrder[0]);
      expect(recordOrder).toBeLessThan(repositoryMock.delete.mock.invocationCallOrder[0]);
    });

    it('can record failure for partial deletion', async () => {
      const req = {
        params: { id: 'tenant-a' },
        query: { purge: 'true' },
        user: purgeUser,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      const entity = new TenantEntity(repositoryMock, archivedTenant);
      repositoryMock.get.mockResolvedValueOnce(entity);
      repositoryMock.delete.mockResolvedValueOnce(true);
      realmServiceMock.deleteRealm.mockResolvedValueOnce(false);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith({ deletedRealm: false, deletedTenant: true, success: false });
      expect(auditServiceMock.record).toHaveBeenCalledTimes(2);
      expect(auditServiceMock.record).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: 'tenant.deleted' }),
        tenantAudit(
          { id: tenantUrn },
          {
            status: 'failure',
            metadata: expect.objectContaining({ deletedRealm: false, deletedTenant: true }),
          },
        ),
      );
    });

    it('can record error and call next when deletion throws', async () => {
      const req = {
        params: { id: 'tenant-a' },
        query: { purge: 'true' },
        user: purgeUser,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      const entity = new TenantEntity(repositoryMock, archivedTenant);
      repositoryMock.get.mockResolvedValueOnce(entity);
      const error = new Error('Keycloak unavailable');
      realmServiceMock.deleteRealm.mockRejectedValueOnce(error);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.send).not.toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: 'tenant.deleted' }),
        tenantAudit(
          { id: tenantUrn },
          { status: 'error', metadata: expect.objectContaining({ error: 'Keycloak unavailable' }) },
        ),
      );
    });

    it('can update tenant name', async () => {
      const req = {
        params: { id: 'tenant-a' },
        body: {
          name: 'new-mock-name',
        },
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = updateTenantName(loggerMock, repositoryMock, eventServiceMock, auditServiceMock);

      const entity = new TenantEntity(repositoryMock, tenant);
      repositoryMock.get.mockResolvedValueOnce(entity);
      repositoryMock.save.mockResolvedValueOnce({ ...entity, name: 'new-mock-name' });

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'new-mock-name' }));
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.updated', captureChangeSet: true }),
        tenantAudit(
          { id: tenantUrn, name: 'new-mock-name' },
          { changeSet: { before: { name: tenant.name }, after: { name: 'new-mock-name' } } },
        ),
      );
    });

    it('can call next with not found', async () => {
      const req = {
        params: { id: 'tenant-a' },
        query: {},
        user: { isCore: true },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = deleteTenant(realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

      repositoryMock.get.mockResolvedValueOnce(null);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('restoreTenant', () => {
    const createHandler = () =>
      restoreTenant(loggerMock, realmServiceMock, repositoryMock, eventServiceMock, auditServiceMock);

    it('can restore an archived tenant', async () => {
      const req = { params: { id: 'tenant-a' }, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, archivedTenant));
      repositoryMock.save.mockImplementationOnce((e) => Promise.resolve(e));
      realmServiceMock.enableRealm.mockResolvedValueOnce(undefined);
      await createHandler()(req as unknown as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(realmServiceMock.enableRealm).toHaveBeenCalledWith(expect.objectContaining({ realm: tenant.realm }));
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', deletedAt: null }));
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: tenantUrn, status: 'active' }));
      expect(res.send).toHaveBeenCalledWith(expect.not.objectContaining({ deletedAt: expect.anything() }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'tenant-restored' }));
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.restored' }),
        tenantAudit({ id: tenantUrn, name: tenant.name }),
      );
    });

    it('can reject restore of a tenant that is not archived', async () => {
      const req = { params: { id: 'tenant-a' }, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, tenant));
      await createHandler()(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(realmServiceMock.enableRealm).not.toHaveBeenCalled();
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });

    it('can call next with not found', async () => {
      const req = { params: { id: 'tenant-a' }, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.get.mockResolvedValueOnce(null);
      await createHandler()(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can keep the tenant archived when the realm cannot be enabled', async () => {
      const req = { params: { id: 'tenant-a' }, user: adminUser };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const error = new Error('Keycloak unavailable');
      repositoryMock.get.mockResolvedValueOnce(new TenantEntity(repositoryMock, archivedTenant));
      realmServiceMock.enableRealm.mockRejectedValueOnce(error);
      await createHandler()(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(repositoryMock.save).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });
  });

  describe('createTenant', () => {
    it('can create handler', () => {
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);
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
        status: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);

      req.getConfiguration.mockResolvedValueOnce([[], []]);
      repositoryMock.save.mockResolvedValueOnce(
        new TenantEntity(repositoryMock, { ...tenant, status: 'provisioning' }),
      );
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`,
          status: 'provisioning',
        }),
      );
    });

    it('can provision tenant realm and mark active', async () => {
      const req = {
        body: {
          name: tenant.name,
        },
        user: { isCore: true, roles: [TenantServiceRoles.BetaTester], email: 'beta-tester@test.co' },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);
      req.getConfiguration.mockResolvedValueOnce([[], []]);

      const provisioningEntity = new TenantEntity(repositoryMock, { ...tenant, status: 'provisioning' });
      repositoryMock.save.mockResolvedValueOnce(provisioningEntity);
      realmServiceMock.createRealm.mockResolvedValueOnce(undefined);
      repositoryMock.save.mockResolvedValueOnce(new TenantEntity(repositoryMock, { ...tenant, status: 'active' }));

      await handler(req as unknown as Request, res as unknown as Response, next);

      // Flush pending promises so the detached provisionRealm task completes
      await new Promise((resolve) => setImmediate(resolve));

      expect(realmServiceMock.createRealm).toHaveBeenCalled();
      expect(eventServiceMock.send).toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.created' }),
        tenantAudit(
          { id: tenantUrn },
          { metadata: expect.objectContaining({ realmProvisioning: 'new', serviceClientCount: 0 }) },
        ),
      );
    });

    it('can clean up tenant entity on provisioning failure', async () => {
      const req = {
        body: {
          name: tenant.name,
        },
        user: { isCore: true, roles: [TenantServiceRoles.BetaTester], email: 'beta-tester@test.co' },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);
      req.getConfiguration.mockResolvedValueOnce([[], []]);

      const provisioningEntity = new TenantEntity(repositoryMock, { ...tenant, status: 'provisioning' });
      repositoryMock.save.mockResolvedValueOnce(provisioningEntity);
      realmServiceMock.createRealm.mockRejectedValueOnce(new Error('Keycloak unavailable'));
      realmServiceMock.deleteRealm.mockResolvedValueOnce(true);
      repositoryMock.delete.mockResolvedValueOnce(true);

      await handler(req as unknown as Request, res as unknown as Response, next);

      // Flush pending promises so the detached provisionRealm task completes
      await new Promise((resolve) => setImmediate(resolve));

      expect(realmServiceMock.deleteRealm).toHaveBeenCalled();
      expect(repositoryMock.delete).toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.created' }),
        tenantAudit(
          { id: tenantUrn },
          {
            status: 'failure',
            metadata: expect.objectContaining({ realmProvisioning: 'new', error: 'Keycloak unavailable' }),
          },
        ),
      );
      expect(auditServiceMock.record.mock.invocationCallOrder[0]).toBeLessThan(
        repositoryMock.delete.mock.invocationCallOrder[0],
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
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

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
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

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
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

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
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

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
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);

      repositoryMock.save.mockResolvedValueOnce(new TenantEntity(repositoryMock, tenant));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ ...tenant, id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` }),
      );
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'tenant.created' }),
        tenantAudit(
          { id: tenantUrn },
          { metadata: expect.objectContaining({ realmProvisioning: 'existing', realm: tenant.realm }) },
        ),
      );
      expect(realmServiceMock.createRealm).not.toHaveBeenCalled();
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
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(InvalidOperationError));
    });

    it('can create multiple tenants by tenant admin', async () => {
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
      const handler = createTenant(loggerMock, repositoryMock, realmServiceMock, eventServiceMock, auditServiceMock);

      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([]);
      repositoryMock.find.mockResolvedValueOnce([new TenantEntity(repositoryMock, tenant)]);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
