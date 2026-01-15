import { adspId, getContextTrace } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request } from 'express';
import { TargetProxy } from './target';
import { AuthenticationClient } from './client';
import { Logger } from 'winston';
import { OutgoingHttpHeaders, RequestOptions } from 'http';
import TraceParent = require('traceparent');

jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  getContextTrace: jest.fn(),
}));

const getContextTraceMock = getContextTrace as jest.MockedFunction<typeof getContextTrace>;

describe('TargetProxy', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const clientMock = {
    tenantId
  };

  beforeEach(() => {
    directoryMock.getServiceUrl.mockClear();
    getContextTraceMock.mockClear();
  });

  it('can be created', () => {
    const proxy = new TargetProxy(
      loggerMock as unknown as Logger,
      clientMock as unknown as AuthenticationClient,
      directoryMock,
      {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      }
    );
    expect(proxy).toBeTruthy();
  });

  describe('getProxyHandler', () => {
    it('can get proxy handler', async () => {
      const target = {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      };
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        target
      );

      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://test-service'));
      const handler = await proxy.getProxyHandler();
      expect(handler).toBeTruthy();
      expect(directoryMock.getServiceUrl).toHaveBeenCalledWith(target.upstream);
    });

    it('can throw for upstream not in directory', async () => {
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        {
          id: 'test',
          upstream: adspId`urn:ads:platform:test-service`,
        }
      );

      directoryMock.getServiceUrl.mockResolvedValueOnce(null);
      await expect(proxy.getProxyHandler()).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('getUserToken', () => {
    it('can get token', async () => {
      const target = {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      };
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        target
      );

      const req = {
        user: { accessToken: 'abc-123', exp: Date.now() / 1000 + 300, authenticatedBy: 'test' },
      };

      const token = await proxy.getUserToken(req as unknown as Request);
      expect(token).toBe(req.user.accessToken);
    });

    it('can refresh stale token', async () => {
      const target = {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      };

      const client = {
        refreshTokens: jest.fn(),
      };
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        client as unknown as AuthenticationClient,
        directoryMock,
        target
      );

      const req = {
        user: { accessToken: 'abc-123', exp: Date.now() / 1000, authenticatedBy: 'test' },
      };

      const newToken = '123-abc';
      client.refreshTokens.mockResolvedValueOnce(newToken);

      const token = await proxy.getUserToken(req as unknown as Request);
      expect(token).toBe(newToken);
      expect(client.refreshTokens).toHaveBeenCalledWith(req);
    });
  });

  describe('decorateRequest', () => {
    it('can add authorization header', async () => {
      const target = {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      };
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        target
      );

      const req = {
        user: { accessToken: 'abc-123', exp: Date.now() / 1000 + 300, authenticatedBy: 'test' },
      };

      const options = await proxy.decorateRequest({ headers: {} } as RequestOptions, req as unknown as Request);
      expect((options.headers as OutgoingHttpHeaders).Authorization).toBe('Bearer abc-123');
    });

    it('can add traceparent header', async () => {
      const target = {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      };
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        target
      );

      const req = {
        user: { accessToken: 'abc-123', exp: Date.now() / 1000 + 300, authenticatedBy: 'test' },
      };

      const trace = TraceParent.startOrResume(null, { transactionSampleRate: 5 });
      getContextTraceMock.mockReturnValueOnce(trace);

      const options = await proxy.decorateRequest({ headers: {} } as RequestOptions, req as unknown as Request);
      expect((options.headers as string[])['traceparent']).toBe(trace.toString());
    });
  });

  describe('resolveRequestPath', () => {
    it('can resolve path', () => {
      const target = {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      };
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        target
      );

      const req = {
        user: { accessToken: 'abc-123', exp: Date.now() / 1000 + 300, authenticatedBy: 'test' },
        originalUrl: '/token-handler/v1/targets/test/abc/123?test=true'
      };

      const path = proxy.resolveRequestPath(new URL('http://test-service/test/v1'), req as unknown as Request)
      expect(path).toBe('/test/v1/abc/123?test=true');
    });
  });
});
