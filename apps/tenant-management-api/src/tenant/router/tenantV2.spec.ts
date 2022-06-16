import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { createTenantV2Router, getTenant, getTenants } from './tenantV2';

describe('createTenantV2Router', () => {
  const repositoryMock = {
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.find.mockReset();
    repositoryMock.get.mockReset();
  });

  it('can create router', () => {
    const router = createTenantV2Router({ tenantRepository: repositoryMock });
    expect(router).toBeTruthy();
  });

  describe('getTenants', () => {
    it('can create handler', () => {
      const handler = getTenants(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tenants', async () => {
      const req = {
        query: {},
        user: { isCore: true },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(
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
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

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
      expect(res.json).toHaveBeenCalledWith(
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
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(
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
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

      const tenant = {
        id: 'tenant-123',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.find.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(
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
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

      repositoryMock.find.mockRejectedValueOnce(new Error('oh noes!'));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getTenant', () => {
    it('can create handler', () => {
      const handler = getTenant(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tenant', async () => {
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: true },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.get.mockResolvedValueOnce(tenant);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(
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
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.get.mockResolvedValueOnce(tenant);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(
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
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(repositoryMock);

      const tenant = {
        id: 'tenant-a',
        name: 'tenant-a',
        realm: 'tenant-a-realm',
        adminEmail: 'tester@test.co',
      };
      repositoryMock.get.mockResolvedValueOnce(tenant);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(res.json).not.toHaveBeenCalled();
    });

    it('can call next with error', async () => {
      const req = {
        params: { id: 'tenant-a' },
        user: { isCore: true },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(repositoryMock);

      repositoryMock.get.mockRejectedValueOnce(new Error('oh noes!'));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
