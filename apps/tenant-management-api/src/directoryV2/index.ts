export { bootstrapV2Directory } from './bootstrap';

import { Logger } from 'winston';
export * from '../directory/types';
export * from '../directory/repository';
//export * as directoryV2Service from './services';
import * as passport from 'passport';
import { Application } from 'express';
import { Repositories } from '../directory/repository';
import { createDirectoryRouter } from './router';

const passportMiddleware = passport.authenticate(['jwt', 'jwt-tenant'], { session: false });
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

  app.use('/api/directory/v2', passportMiddleware, directoryRouter);

  return app;
};
