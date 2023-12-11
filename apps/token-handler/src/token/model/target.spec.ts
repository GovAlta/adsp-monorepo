import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request } from 'express';
import { TargetProxy } from './target';
import { AuthenticationClient } from './client';

describe('TargetProxy', () => {
  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const clientMock = {};

  beforeEach(() => {
    directoryMock.getServiceUrl.mockClear();
  });

  it('can be created', () => {
    const proxy = new TargetProxy(clientMock as unknown as AuthenticationClient, directoryMock, {
      id: 'test',
      upstream: adspId`urn:ads:platform:test-service`,
    });
    expect(proxy).toBeTruthy();
  });

  describe('getProxyHandler', () => {
    it('can get proxy handler', async () => {
      const target = {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      };
      const proxy = new TargetProxy(clientMock as unknown as AuthenticationClient, directoryMock, target);

      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://test-service'));
      const handler = await proxy.getProxyHandler();
      expect(handler).toBeTruthy();
      expect(directoryMock.getServiceUrl).toHaveBeenCalledWith(target.upstream);
    });

    it('can throw for upstream not in directory', async () => {
      const proxy = new TargetProxy(clientMock as unknown as AuthenticationClient, directoryMock, {
        id: 'test',
        upstream: adspId`urn:ads:platform:test-service`,
      });

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
      const proxy = new TargetProxy(clientMock as unknown as AuthenticationClient, directoryMock, target);

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
      const proxy = new TargetProxy(client as unknown as AuthenticationClient, directoryMock, target);

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
});
