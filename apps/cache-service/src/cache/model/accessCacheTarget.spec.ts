import { adspId, ServiceDirectory, TenantService } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { ServiceRoles } from '../roles';
import { AccessCacheTarget } from './accessCacheTarget';

describe('accessCacheTarget', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(),
  };

  const providerMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const tenantServiceMock = {
    getTenant: jest.fn(() => Promise.resolve({ id: tenantId, realm: 'test' })),
  };

  beforeEach(() => {
    providerMock.del.mockReset();
  });

  it('can be created', () => {
    const target = new AccessCacheTarget(
      logger,
      directoryMock as unknown as ServiceDirectory,
      tenantServiceMock as unknown as TenantService,
      providerMock,
      tenantId,
      {
        serviceId: adspId`urn:ads:platform:access-service:v1`,
      }
    );

    expect(target).toBeTruthy();
  });

  it('can throw when created against wrong service', () => {
    expect(
      () =>
        new AccessCacheTarget(
          logger,
          directoryMock as unknown as ServiceDirectory,
          tenantServiceMock as unknown as TenantService,
          providerMock,
          tenantId,
          {
            serviceId: adspId`urn:ads:platform:configuration-service`,
          }
        )
    ).toThrowError();
  });

  describe('get', () => {
    const target = new AccessCacheTarget(
      logger,
      directoryMock as unknown as ServiceDirectory,
      tenantServiceMock as unknown as TenantService,
      providerMock,
      tenantId,
      {
        serviceId: adspId`urn:ads:platform:access-service:v1`,
      }
    );

    it('can send cached response for user', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '/cache/urn:ads:platform:access-service:v1/test/users',
        query: {},
        tenant: {
          realm: 'test',
          id: tenantId,
        },
        user: {
          id: 'tester',
          isCore: true,
          roles: ['realm-management:view-users', ServiceRoles.CacheReader],
          token: { aud: ['urn:ads:platform:cache-service'], scope: 'openid' },
        },
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      const cached = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        content: Buffer.from('This is some string content', 'utf-8'),
      };
      providerMock.get.mockResolvedValueOnce(cached);

      await target.get(req as unknown as Request, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(cached.status);
      expect(res.header).toHaveBeenCalledWith(expect.objectContaining(cached.headers));
      expect(res.send).toHaveBeenCalledWith(cached.content);
    });

    it('can throw for anonymous user', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '/cache/urn:ads:platform:access-service:v1/test/users',
        query: {},
        tenant: {
          realm: 'test',
          id: tenantId,
        },
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      await expect(target.get(req as unknown as Request, res as unknown as Response)).rejects.toThrow(Error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.header).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can throw for path not matching tenant', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '/cache/urn:ads:platform:access-service:v1/not-test/users',
        query: {},
        tenant: {
          realm: 'test',
          id: tenantId,
        },
        user: {
          id: 'tester',
          isCore: true,
          roles: ['realm-management:view-users', ServiceRoles.CacheReader],
          token: { aud: ['urn:ads:platform:cache-service'], scope: 'openid' },
        },
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      await expect(target.get(req as unknown as Request, res as unknown as Response)).rejects.toThrow(Error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.header).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('processEvent', () => {
    const target = new AccessCacheTarget(
      logger,
      directoryMock as unknown as ServiceDirectory,
      tenantServiceMock as unknown as TenantService,
      providerMock,
      tenantId,
      {
        serviceId: adspId`urn:ads:platform:access-service:v1`,
      }
    );

    it('can invalidate cache entry', async () => {
      providerMock.del.mockResolvedValueOnce(true);
      await target.processEvent({
        tenantId,
        namespace: 'access-service',
        name: 'DELETE-USER',
        payload: {
          resourceType: 'USER',
          operationType: 'DELETE',
          resourcePath: '/users/abc-123',
        },
        timestamp: new Date(),
      });

      expect(providerMock.del).toHaveBeenCalled();
    });

    it('can skip unrecognized event namespace', async () => {
      await target.processEvent({
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        payload: {},
        timestamp: new Date(),
      });

      expect(providerMock.del).not.toHaveBeenCalled();
    });

    it('can skip non admin event', async () => {
      await target.processEvent({
        tenantId,
        namespace: 'access-service',
        name: 'LOGIN',
        payload: {
          resourcePath: '',
        },
        timestamp: new Date(),
      });

      expect(providerMock.del).not.toHaveBeenCalled();
    });

    it('can handle error on processing', async () => {
      providerMock.del.mockRejectedValueOnce(new Error('oh noes!'));
      await target.processEvent({
        tenantId,
        namespace: 'access-service',
        name: 'DELETE-USER',
        payload: {
          resourceType: 'USER',
          operationType: 'DELETE',
          resourcePath: '/users/abc-123',
        },
        timestamp: new Date(),
      });

      expect(providerMock.del).toHaveBeenCalled();
    });
  });
});
