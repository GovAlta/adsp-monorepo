import { Logger } from 'winston';
export * from '../directory/types';
export * from '../directory/repository';
import { Application } from 'express';
import { Repositories } from '../directory/repository';
import { createDirectoryRouter } from './router';

interface DirectoryMiddlewareProps extends Repositories {
  logger: Logger;
}

export const applyDirectoryV2Middleware = (
  app: Application,
  { logger, directoryRepository }: DirectoryMiddlewareProps
): Application => {
  const directoryRouterProps = {
    logger,
    directoryRepository,
  };

  const directoryRouter = createDirectoryRouter(directoryRouterProps);

  app.use('/api/directory/v2', directoryRouter);

  return app;
};
