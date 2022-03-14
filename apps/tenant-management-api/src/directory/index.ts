export { bootstrapDirectory } from './bootstrap';

import { Logger } from 'winston';
export * from './types';
export * from './repository';
export * from './model';
export * as directoryService from './services';
import * as passport from 'passport';
import { Application } from 'express';
import { Repositories } from './repository';
import { createDirectoryRouter } from './router';

const passportMiddleware = passport.authenticate(['jwt', 'jwt-tenant'], { session: false });
interface DirectoryMiddlewareProps extends Repositories {
  logger: Logger;
}

export const applyDirectoryMiddleware = (app: Application, { logger, directoryRepository }: DirectoryMiddlewareProps): Application => {
  const directoryRouterProps = {
    logger,
    directoryRepository,
  };

  const directoryRouter = createDirectoryRouter(directoryRouterProps);

  app.use('/api/discovery/v1', passportMiddleware, directoryRouter);

  return app;
};
