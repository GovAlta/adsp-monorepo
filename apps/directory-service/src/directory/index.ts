import { Logger } from 'winston';
export * from '../directory/types';
export * from '../directory/repository';
import { Application } from 'express';
import { Repositories } from '../directory/repository';
import { createDirectoryRouter } from './router';
import { TenantService, EventService } from '@abgov/adsp-service-sdk';
export * from './roles';
export * from './bootstrap';
interface DirectoryMiddlewareProps extends Repositories {
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
}

export const applyDirectoryV2Middleware = (
  app: Application,
  { logger, directoryRepository, tenantService, eventService }: DirectoryMiddlewareProps
): Application => {
  const directoryRouterProps = {
    logger,
    directoryRepository,
    tenantService,
    eventService,
  };

  const directoryRouter = createDirectoryRouter(directoryRouterProps);

  app.use('/directory/v2', directoryRouter);

  return app;
};
