import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { createCacheRouter, getCacheTargetResource } from './router';

describe('router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  describe('createCacheRouter', () => {
    it('can create router', () => {
      const router = createCacheRouter();
      expect(router).toBeTruthy();
    });
  });

  describe('getCacheTargetResource', () => {
    it('can create handler', () => {
      const handler = getCacheTargetResource();
      expect(handler).toBeTruthy();
    });

    it('can handle get resource request', async () => {
      const req = {
        tenant: { id: tenantId },
        params: { target: 'urn:ads:platform:file-service' },
        getServiceConfiguration: jest.fn(),
      };
      const res = {};
      const next = jest.fn();

      const configuration = { getTarget: jest.fn() };
      req.getServiceConfiguration.mockResolvedValueOnce(configuration);
      const target = { get: jest.fn() };
      configuration.getTarget.mockReturnValueOnce(target);

      const handler = getCacheTargetResource();
      await handler(req as unknown as Request, res as Response, next);
      expect(configuration.getTarget).toHaveBeenCalledWith(req.params.target);
      expect(target.get).toHaveBeenCalledWith(req, res);
    });

    it('can call next with not found', async () => {
      const req = {
        tenant: { id: tenantId },
        params: { target: 'urn:ads:platform:file-service' },
        getServiceConfiguration: jest.fn(),
      };
      const res = {};
      const next = jest.fn();

      const configuration = { getTarget: jest.fn() };
      req.getServiceConfiguration.mockResolvedValueOnce(configuration);
      configuration.getTarget.mockReturnValueOnce(null);

      const handler = getCacheTargetResource();
      await handler(req as unknown as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with cache target error', async () => {
      const req = {
        tenant: { id: tenantId },
        params: { target: 'urn:ads:platform:file-service' },
        getServiceConfiguration: jest.fn(),
      };
      const res = {};
      const next = jest.fn();

      const configuration = { getTarget: jest.fn() };
      req.getServiceConfiguration.mockResolvedValueOnce(configuration);

      const err = new Error('Oh noes!');
      const target = { get: jest.fn() };
      target.get.mockRejectedValueOnce(err);
      configuration.getTarget.mockReturnValueOnce(target);

      const handler = getCacheTargetResource();
      await handler(req as unknown as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });

    it('can call next with invalid operation', async () => {
      const req = {
        params: { target: 'urn:ads:platform:file-service' },
        getServiceConfiguration: jest.fn(),
      };
      const res = {};
      const next = jest.fn();

      const handler = getCacheTargetResource();
      await handler(req as unknown as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });
});
