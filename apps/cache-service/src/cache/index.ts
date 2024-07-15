import { Application } from 'express';
import { createCacheRouter } from './router';

export * from './cacheProvider';
export * from './configuration';
export * from './roles';
export * from './types';

export function applyCacheMiddleware(app: Application) {
  const router = createCacheRouter();
  app.use('/cache/v1', router);
}
