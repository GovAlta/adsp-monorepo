import { Logger } from 'winston';
export * from '../directory/types';
export * from '../directory/repository';
import { Application } from 'express';
import { Repositories } from '../directory/repository';
import { createDirectoryRouter } from './router';
import { TenantService } from '@abgov/adsp-service-sdk';

interface DirectoryMiddlewareProps extends Repositories {
  logger: Logger;
  tenantService: TenantService;
}

export const applyDirectoryV2Middleware = (
  app: Application,
  { logger, directoryRepository, tenantService }: DirectoryMiddlewareProps
): Application => {
  const directoryRouterProps = {
    logger,
    directoryRepository,
    tenantService,
  };

  const directoryRouter = createDirectoryRouter(directoryRouterProps);

  app.use('/api/directory/v2', directoryRouter);

  return app;
};
