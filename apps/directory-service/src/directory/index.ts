import { Logger } from 'winston';
export * from '../directory/types';
export * from '../directory/repository';
import { Application } from 'express';
import { Repositories } from '../directory/repository';
import { createDirectoryRouter } from './router';
import { AdspId, TenantService, EventService } from '@abgov/adsp-service-sdk';
export * from './roles';
export * from './bootstrap';
interface DirectoryMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
}

export const applyDirectoryV2Middleware = (
  app: Application,
  { serviceId, logger, directoryRepository, tenantService, eventService }: DirectoryMiddlewareProps
): Application => {
  const directoryRouterProps = {
    serviceId,
    logger,
    directoryRepository,
    tenantService,
    eventService,
  };

  const directoryRouter = createDirectoryRouter(directoryRouterProps);

  app.use('/directory/v2', directoryRouter);

  return app;
};
