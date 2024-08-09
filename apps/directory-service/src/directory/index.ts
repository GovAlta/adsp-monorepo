import { Logger } from 'winston';
export * from '../directory/types';
export * from '../directory/repository';
import { Application } from 'express';
import { Repositories } from '../directory/repository';
import { createDirectoryRouter, createResourceRouter } from './router';
import { TenantService, EventService } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';

export * from './bootstrap';
export * from './model';
export * from './repository';
export * from './roles';
export * from './types';

interface DirectoryMiddlewareProps extends Repositories {
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
}

export const applyDirectoryMiddleware = (
  app: Application,
  { logger, directoryRepository, tenantService, eventService }: DirectoryMiddlewareProps
): Application => {
  const directoryRouter = createDirectoryRouter({
    logger,
    directoryRepository,
    tenantService,
    eventService,
  });

  const resourceRouter = createResourceRouter({
    logger,
    eventService,
    repository: directoryRepository,
  });

  app.use('/directory/v2', directoryRouter);
  app.use('/resource/v1', assertAuthenticatedHandler, resourceRouter);

  return app;
};
