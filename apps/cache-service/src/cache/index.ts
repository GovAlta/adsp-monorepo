import { DomainEvent, WorkQueueService } from '@core-services/core-common';
import { Application } from 'express';
import { createCacheRouter } from './router';
import { createCacheJobs } from './job';
import { Logger } from 'winston';
import { ConfigurationService } from '@abgov/adsp-service-sdk';

export * from './cacheProvider';
export * from './configuration';
export * from './roles';
export * from './types';

interface CacheMiddlewareProps {
  logger: Logger;
  configurationService: ConfigurationService;
  queueService: WorkQueueService<DomainEvent>;
}

export function applyCacheMiddleware(
  app: Application,
  { logger, configurationService, queueService }: CacheMiddlewareProps
) {
  const router = createCacheRouter();
  app.use('/cache/v1', router);

  createCacheJobs({ logger, configurationService, queueService });
}
