import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { adspId, getContextTrace, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import type { ServiceDirectory } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import * as hasha from 'hasha';
import { ClientRequest, IncomingMessage } from 'http';
import * as https from 'https';
import { Logger } from 'winston';
import { CacheTarget } from './cacheTarget';
import { ServiceRoles } from '../roles';

jest.mock('https');
const httpsMock = https as jest.Mocked<typeof https>;

jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  getContextTrace: jest.fn(),
}));
const getContextTraceMock = getContextTrace as jest.Mock;

describe('CacheTarget', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const providerMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(() => {
    directoryMock.getServiceUrl.mockReset();
    directoryMock.getResourceUrl.mockReset();
    providerMock.get.mockReset();
    providerMock.set.mockReset();
    providerMock.del.mockReset();
    httpsMock.request.mockReset();
    getContextTraceMock.mockReset();
  });

  it('can be created', () => {
    const target = new CacheTarget(logger, directoryMock as unknown as ServiceDirectory, providerMock, tenantId, {
      serviceId: adspId`urn:ads:platform:file-service`,
      ttl: 300,
    });
    expect(target).toBeTruthy();
  });

  describe('get', () => {
    const target = new CacheTarget(logger, directoryMock as unknown as ServiceDirectory, providerMock, tenantId, {
      serviceId: adspId`urn:ads:platform:test-service:v1`,
      ttl: 300,
    });

    it('can send response with cache hit', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {},
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

      await target.get(req as Request, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(cached.status);
      expect(res.header).toHaveBeenCalledWith(expect.objectContaining(cached.headers));
      expect(res.send).toHaveBeenCalledWith(cached.content);
    });

    it('can send response with cache miss', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {
          flag: 'true',
        },
        baseUrl: '/cache/v1',
        originalUrl: '/cache/v1/cache/urn:ads:platform:test-service:v1/test-resource',
        pipe: jest.fn(),
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      providerMock.get.mockResolvedValueOnce(null);

      const targetUrl = new URL('https://test-service/test/v1');
      directoryMock.getServiceUrl.mockResolvedValueOnce(targetUrl);

      const content = Buffer.from('test string content', 'utf-8');
      const upstreamReq = {};
      const upstreamRes = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        on: jest.fn((event, cb) => {
          if (event === 'end') {
            setTimeout(cb);
          } else if (event === 'data') {
            setTimeout(() => cb(content));
          }
        }),
        pipe: jest.fn(),
      };
      httpsMock.request.mockImplementationOnce((_url, _opt, cb) => {
        cb(upstreamRes as unknown as IncomingMessage);
        return upstreamReq as unknown as ClientRequest;
      });

      await target.get(req as unknown as Request, res as unknown as Response);
      expect(https.request).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.header).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/json' }));
      expect(upstreamRes.pipe).toHaveBeenCalledWith(res);

      expect(providerMock.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        target.ttl,
        expect.objectContaining({
          status: 200,
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          content: expect.any(Buffer),
        })
      );
    });

    it('can send response on cache error', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {
          flag: 'true',
        },
        baseUrl: '/cache/v1',
        originalUrl: '/cache/v1/cache/urn:ads:platform:test-service:v1/test-resource',
        pipe: jest.fn(),
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      providerMock.get.mockRejectedValueOnce(new Error('oh noes!'));

      const targetUrl = new URL('https://test-service/test/v1');
      directoryMock.getServiceUrl.mockResolvedValueOnce(targetUrl);

      const content = Buffer.from('test string content', 'utf-8');
      const upstreamReq = {};
      const upstreamRes = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        on: jest.fn((event, cb) => {
          if (event === 'end') {
            setTimeout(cb);
          } else if (event === 'data') {
            setTimeout(() => cb(content));
          }
        }),
        pipe: jest.fn(),
      };
      httpsMock.request.mockImplementationOnce((_url, _opt, cb) => {
        cb(upstreamRes as unknown as IncomingMessage);
        return upstreamReq as unknown as ClientRequest;
      });

      await target.get(req as unknown as Request, res as unknown as Response);
      expect(https.request).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.header).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/json' }));
      expect(upstreamRes.pipe).toHaveBeenCalledWith(res);

      expect(providerMock.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        target.ttl,
        expect.objectContaining({
          status: 200,
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          content: expect.any(Buffer),
        })
      );
    });

    it('can send response with cache miss for user', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {
          flag: 'true',
        },
        user: {
          id: 'tester',
          tenantId,
          roles: [ServiceRoles.CacheReader],
          token: { aud: ['urn:ads:platform:cache-service'], scope: 'openid', bearer: 'token' },
        },
        baseUrl: '/cache/v1',
        originalUrl: '/cache/v1/cache/urn:ads:platform:test-service:v1/test-resource',
        pipe: jest.fn(),
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      providerMock.get.mockResolvedValueOnce(null);

      const targetUrl = new URL('https://test-service/test/v1');
      directoryMock.getServiceUrl.mockResolvedValueOnce(targetUrl);

      const content = Buffer.from('test string content', 'utf-8');
      const upstreamReq = {};
      const upstreamRes = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        on: jest.fn((event, cb) => {
          if (event === 'end') {
            setTimeout(cb);
          } else if (event === 'data') {
            setTimeout(() => cb(content));
          }
        }),
        pipe: jest.fn(),
      };
      httpsMock.request.mockImplementationOnce((_url, _opt, cb) => {
        cb(upstreamRes as unknown as IncomingMessage);
        return upstreamReq as unknown as ClientRequest;
      });

      await target.get(req as unknown as Request, res as unknown as Response);
      expect(httpsMock.request).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }),
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.header).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/json' }));
      expect(upstreamRes.pipe).toHaveBeenCalledWith(res);

      expect(providerMock.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        target.ttl,
        expect.objectContaining({
          status: 200,
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          content: expect.any(Buffer),
        })
      );
    });

    it('can send response with cache miss and set traceparent header', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {
          flag: 'true',
        },
        baseUrl: '/cache/v1',
        originalUrl: '/cache/v1/cache/urn:ads:platform:test-service:v1/test-resource',
        pipe: jest.fn(),
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      getContextTraceMock.mockReturnValueOnce('trace-123');
      providerMock.get.mockResolvedValueOnce(null);

      const targetUrl = new URL('https://test-service/test/v1');
      directoryMock.getServiceUrl.mockResolvedValueOnce(targetUrl);

      const content = Buffer.from('test string content', 'utf-8');
      const upstreamReq = {};
      const upstreamRes = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        on: jest.fn((event, cb) => {
          if (event === 'end') {
            setTimeout(cb);
          } else if (event === 'data') {
            setTimeout(() => cb(content));
          }
        }),
        pipe: jest.fn(),
      };
      httpsMock.request.mockImplementationOnce((_url, _opt, cb) => {
        cb(upstreamRes as unknown as IncomingMessage);
        return upstreamReq as unknown as ClientRequest;
      });

      await target.get(req as unknown as Request, res as unknown as Response);
      expect(https.request).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({ headers: expect.objectContaining({ traceparent: 'trace-123' }) }),
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.header).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/json' }));
      expect(upstreamRes.pipe).toHaveBeenCalledWith(res);

      expect(providerMock.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        target.ttl,
        expect.objectContaining({
          status: 200,
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          content: expect.any(Buffer),
        })
      );
    });

    it('can send response with cache miss and not cache empty content', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {
          flag: 'true',
        },
        baseUrl: '/cache/v1',
        originalUrl: '/cache/v1/cache/urn:ads:platform:test-service:v1/test-resource',
        pipe: jest.fn(),
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      providerMock.get.mockResolvedValueOnce(null);

      const targetUrl = new URL('https://test-service/test/v1');
      directoryMock.getServiceUrl.mockResolvedValueOnce(targetUrl);

      const upstreamReq = {};
      const upstreamRes = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        on: jest.fn((event, cb) => {
          if (event === 'end') {
            setTimeout(cb);
          }
        }),
        pipe: jest.fn(),
      };
      httpsMock.request.mockImplementationOnce((_url, _opt, cb) => {
        cb(upstreamRes as unknown as IncomingMessage);
        return upstreamReq as unknown as ClientRequest;
      });

      await target.get(req as unknown as Request, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.header).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/json' }));
      expect(upstreamRes.pipe).toHaveBeenCalledWith(res);

      expect(providerMock.set).not.toHaveBeenCalled();
    });

    it('can send response with cache miss and throw on upstream error', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {
          flag: 'true',
        },
        baseUrl: '/cache/v1',
        originalUrl: '/cache/v1/cache/urn:ads:platform:test-service:v1/test-resource',
        pipe: jest.fn(),
      };
      const res = {
        status: jest.fn(() => res),
        header: jest.fn(() => res),
        send: jest.fn(() => res),
      };

      providerMock.get.mockResolvedValueOnce(null);

      const targetUrl = new URL('https://test-service/test/v1');
      directoryMock.getServiceUrl.mockResolvedValueOnce(targetUrl);

      const upstreamReq = {};
      const upstreamRes = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        on: jest.fn((event, cb) => {
          if (event === 'error') {
            setTimeout(() => cb(new Error('Oh noes!')));
          }
        }),
        pipe: jest.fn(),
      };
      httpsMock.request.mockImplementationOnce((_url, _opt, cb) => {
        cb(upstreamRes as unknown as IncomingMessage);
        return upstreamReq as unknown as ClientRequest;
      });

      await expect(target.get(req as unknown as Request, res as unknown as Response)).rejects.toThrow(Error);
    });

    it('can send cached response for user', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {},
        user: {
          id: 'tester',
          isCore: true,
          roles: [ServiceRoles.CacheReader],
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

    it('can throw invalid operation on non-GET', async () => {
      const req = {
        method: 'PATCH',
        headers: {},
        path: '',
        query: {},
      };
      const res = {};

      await expect(target.get(req as Request, res as unknown as Response)).rejects.toThrow(InvalidOperationError);
    });

    it('can throw invalid operation on client not accept gzip', async () => {
      const req = {
        method: 'GET',
        headers: { 'accept-encoding': 'br' },
        path: '',
        query: {},
      };
      const res = {};

      await expect(target.get(req as unknown as Request, res as unknown as Response)).rejects.toThrow(
        InvalidOperationError
      );
    });

    it('can throw unauthorized on user without role', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {},
        user: {
          id: 'tester',
          tenantId,
          roles: [],
          token: { aud: ['urn:ads:platform:cache-service'], scope: 'openid' },
        },
      };
      const res = {};

      await expect(target.get(req as unknown as Request, res as unknown as Response)).rejects.toThrow(
        UnauthorizedUserError
      );
    });

    it('can throw not found for missing directory entry', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {},
        baseUrl: '/cache/v1',
      };
      const res = {};

      providerMock.get.mockResolvedValueOnce(null);
      directoryMock.getServiceUrl.mockResolvedValueOnce(null);

      await expect(target.get(req as Request, res as unknown as Response)).rejects.toThrow(NotFoundError);
    });

    it('can throw invalid operation for path traversal', async () => {
      const req = {
        method: 'GET',
        headers: {},
        path: '',
        query: {},
        baseUrl: '/cache/v1',
        originalUrl: '/cache/v1/cache/urn:ads:platform:test-service:v1/../test-resource',
      };
      const res = {};

      providerMock.get.mockResolvedValueOnce(null);

      const targetUrl = new URL('https://test-service/test/v1');
      directoryMock.getServiceUrl.mockResolvedValueOnce(targetUrl);

      await expect(target.get(req as Request, res as unknown as Response)).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('processEvent', () => {
    const target = new CacheTarget(logger, directoryMock as unknown as ServiceDirectory, providerMock, tenantId, {
      serviceId: adspId`urn:ads:platform:test-service:v1`,
      ttl: 300,
      invalidationEvents: [
        {
          namespace: 'configuration-service',
          name: 'configuration-updated',
          resourceIdPath: 'urn',
        },
      ],
    });

    it('can invalidate cache entry', async () => {
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://test-service/test/v1'));
      directoryMock.getResourceUrl.mockResolvedValueOnce(
        new URL('https://test-service/test/v1/configuration/form-service/test')
      );
      providerMock.del.mockResolvedValueOnce(true);
      await target.processEvent({
        tenantId,
        namespace: 'configuration-service',
        name: 'configuration-updated',
        payload: {
          urn: 'urn:ads:platform:test-service:v1:/configuration/form-service/test',
        },
        timestamp: new Date(),
      });

      const invalidateKey = hasha(
        JSON.stringify({
          tenantId: tenantId.toString(),
          path: '/cache/urn:ads:platform:test-service:v1/configuration/form-service/test',
        })
      );
      expect(providerMock.del).toHaveBeenCalledWith(invalidateKey);
    });

    it('can invalidate multiple cache entry on event', async () => {
      const target = new CacheTarget(logger, directoryMock as unknown as ServiceDirectory, providerMock, tenantId, {
        serviceId: adspId`urn:ads:platform:test-service:v1`,
        ttl: 300,
        invalidationEvents: [
          {
            namespace: 'configuration-service',
            name: 'configuration-updated',
            resourceIdPath: ['urn', 'nested.urn'],
          },
        ],
      });
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://test-service/test/v1'));
      directoryMock.getResourceUrl
        .mockResolvedValueOnce(new URL('https://test-service/test/v1/configuration/form-service/test'))
        .mockResolvedValueOnce(new URL('https://test-service/test/v1/configuration/form-service/test2'));
      providerMock.del.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      await target.processEvent({
        tenantId,
        namespace: 'configuration-service',
        name: 'configuration-updated',
        payload: {
          urn: 'urn:ads:platform:test-service:v1:/configuration/form-service/test',
          nested: {
            urn: 'urn:ads:platform:test-service:v1:/configuration/form-service/test2',
          },
        },
        timestamp: new Date(),
      });

      const invalidateKey = hasha(
        JSON.stringify({
          tenantId: tenantId.toString(),
          path: '/cache/urn:ads:platform:test-service:v1/configuration/form-service/test',
        })
      );
      const invalidateKey2 = hasha(
        JSON.stringify({
          tenantId: tenantId.toString(),
          path: '/cache/urn:ads:platform:test-service:v1/configuration/form-service/test2',
        })
      );
      expect(providerMock.del).toHaveBeenCalledWith(invalidateKey);
      expect(providerMock.del).toHaveBeenCalledWith(invalidateKey2);
    });

    it('can invalidate cache entry for service target', async () => {
      const target = new CacheTarget(logger, directoryMock as unknown as ServiceDirectory, providerMock, tenantId, {
        serviceId: adspId`urn:ads:platform:test-service`,
        ttl: 300,
        invalidationEvents: [
          {
            namespace: 'configuration-service',
            name: 'configuration-updated',
            resourceIdPath: 'urn',
          },
        ],
      });

      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://test-service'));
      directoryMock.getResourceUrl.mockResolvedValueOnce(
        new URL('https://test-service/test/v1/configuration/form-service/test')
      );
      providerMock.del.mockResolvedValueOnce(true);
      await target.processEvent({
        tenantId,
        namespace: 'configuration-service',
        name: 'configuration-updated',
        payload: {
          urn: 'urn:ads:platform:test-service:v1:/configuration/form-service/test',
        },
        timestamp: new Date(),
      });

      const invalidateKey = hasha(
        JSON.stringify({
          tenantId: tenantId.toString(),
          path: '/cache/urn:ads:platform:test-service/test/v1/configuration/form-service/test',
        })
      );
      expect(providerMock.del).toHaveBeenCalledWith(invalidateKey);
    });

    it('can skip unrecognized event', async () => {
      await target.processEvent({
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        payload: {},
        timestamp: new Date(),
      });

      expect(providerMock.del).not.toHaveBeenCalled();
    });

    it('can handle error on processing', async () => {
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://test-service/test/v1'));
      directoryMock.getResourceUrl.mockResolvedValueOnce(
        new URL('https://test-service/test/v1/configuration/form-service/test')
      );
      providerMock.del.mockRejectedValueOnce(new Error('oh noes!'));
      await target.processEvent({
        tenantId,
        namespace: 'configuration-service',
        name: 'configuration-updated',
        payload: {
          urn: 'urn:ads:platform:configuration-service:v2:/configuration/form-service/test',
        },
        timestamp: new Date(),
      });

      expect(providerMock.del).toHaveBeenCalled();
    });
  });
});
