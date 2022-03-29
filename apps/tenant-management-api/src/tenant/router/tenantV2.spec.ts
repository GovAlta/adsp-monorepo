import { adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { TenantRepository } from '../repository';
import * as tenantService from '../services/tenant';
import { createTenantV2Router, getTenant, getTenants } from './tenantV2';

jest.mock('../services/tenant');
const tenantServiceMock = tenantService as jest.Mocked<typeof tenantService>;

describe('createTenantV2Router', () => {
  const repositoryMock: TenantRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    get: jest.fn(),
  };

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
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

      const tenant = {
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-a`,
        name: 'tenant-a',
        realm: 'tenant-a-realm',
      };
      tenantServiceMock.getTenants.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([expect.objectContaining({ ...tenant, id: `${tenant.id}` })]),
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
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

      const tenant = {
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-a`,
        name: 'tenant-a',
        realm: 'tenant-a-realm',
      };
      tenantServiceMock.getTenants.mockResolvedValueOnce([tenant]);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(tenantServiceMock.getTenants).toHaveBeenCalledWith(
        repositoryMock,
        expect.objectContaining({
          nameEquals: req.query.name,
          realmEquals: req.query.realm,
          adminEmailEquals: req.query.adminEmail,
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([expect.objectContaining({ ...tenant, id: `${tenant.id}` })]),
          page: expect.objectContaining({ size: 1 }),
        })
      );
    });

    it('can call next for error', async () => {
      const req = {
        query: {},
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenants(repositoryMock);

      tenantServiceMock.getTenants.mockRejectedValueOnce(new Error('oh noes!'));
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
        params: { id: 'tenant-123' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(repositoryMock);

      const tenant = {
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/tenant-a`,
        name: 'tenant-a',
        realm: 'tenant-a-realm',
      };
      tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ...tenant, id: `${tenant.id}` }));
    });

    it('can call next with error', async () => {
      const req = {
        params: { id: 'tenant-123' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const handler = getTenant(repositoryMock);

      tenantServiceMock.getTenant.mockRejectedValueOnce(new Error('oh noes!'));
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
