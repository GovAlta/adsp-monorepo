import { adspId, getContextTrace } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { TargetProxy } from './target';
import { AuthenticationClient } from './client';
import { Logger } from 'winston';
import { OutgoingHttpHeaders, RequestOptions } from 'http';

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
    tenantId,
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
      },
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
        target,
      );

      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://test-service'));
      const handler = await proxy.getProxyHandler();
      expect(handler).toBeTruthy();
      expect(directoryMock.getServiceUrl).toHaveBeenCalledWith(target.upstream);
    });

    it('can pass invalid request path to next', async () => {
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        { id: 'test', upstream: adspId`urn:ads:platform:test-service` },
      );

      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://test-service/test/v1'));
      const handler = await proxy.getProxyHandler();

      const req = { originalUrl: '/token-handler/v1/targets/test/../other' };
      const next = jest.fn();
      handler(req as Request, {} as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can throw for upstream not in directory', async () => {
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        {
          id: 'test',
          upstream: adspId`urn:ads:platform:test-service`,
        },
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
        target,
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
        target,
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
        target,
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
        target,
      );

      const req = {
        user: { accessToken: 'abc-123', exp: Date.now() / 1000 + 300, authenticatedBy: 'test' },
      };

      const traceString = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      getContextTraceMock.mockReturnValueOnce(traceString);

      const options = await proxy.decorateRequest({ headers: {} } as RequestOptions, req as unknown as Request);
      expect((options.headers as string[])['traceparent']).toBe(traceString);
    });
  });

  describe('decorateRequest headers', () => {
    const createProxy = () =>
      new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        { id: 'test', upstream: adspId`urn:ads:platform:test-service` },
      );

    const req = {
      user: { accessToken: 'abc-123', exp: Date.now() / 1000 + 300, authenticatedBy: 'test' },
    };

    it('does not pass session credentials to the upstream', async () => {
      const options = await createProxy().decorateRequest(
        {
          headers: {
            cookie: 'adsp_tk_session=s%3Asession.signature; XSRF-TOKEN=csrf',
            'x-xsrf-token': 'csrf',
            'x-adsp-tenant': 'test',
            accept: 'application/json',
            'content-type': 'application/json',
          },
        } as RequestOptions,
        req as unknown as Request,
      );

      const headers = options.headers as OutgoingHttpHeaders;
      expect(headers['cookie']).toBeUndefined();
      expect(headers['x-xsrf-token']).toBeUndefined();
      expect(headers['x-adsp-tenant']).toBeUndefined();
      expect(headers['accept']).toBe('application/json');
      expect(headers['content-type']).toBe('application/json');
      expect(headers.Authorization).toBe('Bearer abc-123');
    });

    it('does not pass other credentials or client trace context to the upstream', async () => {
      const options = await createProxy().decorateRequest(
        {
          headers: {
            'proxy-authorization': 'Basic abc',
            traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
            tracestate: 'client=state',
          },
        } as RequestOptions,
        req as unknown as Request,
      );

      const headers = options.headers as OutgoingHttpHeaders;
      expect(headers['proxy-authorization']).toBeUndefined();
      expect(headers['traceparent']).toBeUndefined();
      expect(headers['tracestate']).toBeUndefined();
    });

    it('can remove header names in any case', async () => {
      const options = await createProxy().decorateRequest(
        { headers: { Cookie: 'a=b', 'X-XSRF-TOKEN': 'csrf' } } as unknown as RequestOptions,
        req as unknown as Request,
      );

      const headers = options.headers as OutgoingHttpHeaders;
      expect(Object.keys(headers).map((name) => name.toLowerCase())).not.toContain('cookie');
      expect(Object.keys(headers).map((name) => name.toLowerCase())).not.toContain('x-xsrf-token');
    });

    it('replaces an authorization header from the request with the user token', async () => {
      const options = await createProxy().decorateRequest(
        { headers: { authorization: 'Bearer attacker' } } as RequestOptions,
        req as unknown as Request,
      );

      const headers = options.headers as OutgoingHttpHeaders;
      expect(Object.keys(headers).filter((name) => name.toLowerCase() === 'authorization')).toEqual(['Authorization']);
      expect(headers.Authorization).toBe('Bearer abc-123');
    });
  });

  describe('decorateResponseHeaders', () => {
    it('does not pass cookies from the upstream', () => {
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        { id: 'test', upstream: adspId`urn:ads:platform:test-service` },
      );

      const headers = proxy.decorateResponseHeaders({
        'content-type': 'application/json',
        'set-cookie': ['session=attacker; Path=/'],
        'Set-Cookie2': 'session=attacker',
        'clear-site-data': '"cookies"',
      });
      expect(headers).toEqual({ 'content-type': 'application/json' });
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
        target,
      );

      const req = {
        user: { accessToken: 'abc-123', exp: Date.now() / 1000 + 300, authenticatedBy: 'test' },
        originalUrl: '/token-handler/v1/targets/test/abc/123?test=true',
      };

      const path = proxy.resolveRequestPath(new URL('http://test-service/test/v1'), req as unknown as Request);
      expect(path).toBe('/test/v1/abc/123?test=true');
    });

    describe('request path', () => {
      const proxy = new TargetProxy(
        loggerMock as unknown as Logger,
        clientMock as unknown as AuthenticationClient,
        directoryMock,
        { id: 'test', upstream: adspId`urn:ads:platform:test-service` },
      );
      const upstream = new URL('http://test-service/test/v1');
      const resolve = (relative: string, base = upstream) =>
        proxy.resolveRequestPath(base, { originalUrl: `/token-handler/v1/targets/test${relative}` } as Request);

      it.each([
        ['/abc', '/test/v1/abc'],
        ['/abc/', '/test/v1/abc/'],
        ['/', '/test/v1/'],
        ['', '/test/v1'],
        ['//abc///123', '/test/v1/abc/123'],
        ['/a%20b/c%2Ed', '/test/v1/a%20b/c%2Ed'],
        ['/abc..def/..abc/abc..', '/test/v1/abc..def/..abc/abc..'],
        ['/search/50%25-off', '/test/v1/search/50%25-off'],
        ['/100%25', '/test/v1/100%25'],
        ['/a%2520b', '/test/v1/a%2520b'],
      ])('can resolve %s', (relative, expected) => {
        expect(resolve(relative)).toBe(expected);
      });

      it('can resolve when the target ID is percent-encoded in the URL', () => {
        const encoded = new TargetProxy(
          loggerMock as unknown as Logger,
          clientMock as unknown as AuthenticationClient,
          directoryMock,
          { id: 'my target', upstream: adspId`urn:ads:platform:test-service` },
        );
        const path = encoded.resolveRequestPath(upstream, {
          originalUrl: '/token-handler/v1/targets/my%20target/abc?x=1',
        } as Request);
        expect(path).toBe('/test/v1/abc?x=1');
      });

      it('can resolve against an upstream at the root', () => {
        expect(resolve('/abc', new URL('http://test-service'))).toBe('/abc');
        expect(resolve('', new URL('http://test-service'))).toBe('/');
      });

      it('can resolve against an upstream path with a trailing slash', () => {
        expect(resolve('/abc', new URL('http://test-service/test/v1/'))).toBe('/test/v1/abc');
      });

      it.each([
        '/../other',
        '/abc/../../other',
        '/abc/./def',
        '/%2e%2e/other',
        '/%2E%2E/other',
        '/.%2e/other',
        '/abc/%2e%2e/%2e%2e/other',
        '/%252e%252e/other',
        '/abc%2Fdef',
        '/abc%5Cdef',
        '/abc\\def',
        '/abc%00',
        '/..;/other',
        '/abc/%2e%2e;x=y/other',
        '/%',
        '/%%%%',
        '/abc%',
      ])('can reject path %s', (relative) => {
        expect(() => resolve(relative)).toThrow(InvalidOperationError);
      });

      it('does not treat the query as part of the path', () => {
        expect(resolve('/abc?return=/../../../admin')).toBe('/test/v1/abc?return=/../../../admin');
        expect(resolve('/abc?filter=a%2Fb&x=1')).toBe('/test/v1/abc?filter=a%2Fb&x=1');
        expect(resolve('?x=1')).toBe('/test/v1?x=1');
      });
    });
  });
});
