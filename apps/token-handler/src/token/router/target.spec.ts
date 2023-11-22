import { Request, Response } from 'express';
import { createTargetRouter, proxyRequest } from './target';
import { NotFoundError } from '@core-services/core-common';

describe('target router', () => {
  const configurationMock = {
    getTarget: jest.fn(),
  };

  beforeEach(() => {
    configurationMock.getTarget.mockClear();
  });

  describe('createTargetRouter', () => {
    it('can create router', () => {
      const router = createTargetRouter({ configurationHandler: jest.fn() });
      expect(router).toBeTruthy();
    });
  });

  describe('proxyRequest', () => {
    it('can create handler', () => {
      const handler = proxyRequest();
      expect(handler).toBeTruthy();
    });

    it('can handle proxy request', async () => {
      const req = {
        params: { id: 'test' },
        getConfiguration: jest.fn(() => Promise.resolve([configurationMock])),
      };
      const res = {};
      const next = jest.fn();

      const proxyHandler = jest.fn();
      const target = {
        getProxyHandler: jest.fn(),
      };
      configurationMock.getTarget.mockReturnValueOnce(target);
      target.getProxyHandler.mockResolvedValueOnce(proxyHandler);

      const handler = proxyRequest();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(proxyHandler).toHaveBeenCalledWith(req, res, next);
    });

    it('can call next with not found for unknown target', async () => {
      const req = {
        params: { id: 'test' },
        getConfiguration: jest.fn(() => Promise.resolve([configurationMock])),
      };
      const res = {};
      const next = jest.fn();

      configurationMock.getTarget.mockReturnValueOnce(null);

      const handler = proxyRequest();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
