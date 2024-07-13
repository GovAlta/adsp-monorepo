import { NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { CacheServiceConfiguration } from './configuration';

export function getCacheTargetResource(): RequestHandler {
  return async (req, res, next) => {
    try {
      const { target } = req.params;

      const configuration = await req.getServiceConfiguration<CacheServiceConfiguration, CacheServiceConfiguration>();
      const cacheTarget = configuration.getTarget(target);
      if (!cacheTarget) {
        throw new NotFoundError('cache target', target);
      }

      await cacheTarget.get(req, res);
    } catch (err) {
      next(err);
    }
  };
}

export function createCacheRouter() {
  const router = Router();

  router.get('/cache/:target/*', getCacheTargetResource());

  return router;
}
