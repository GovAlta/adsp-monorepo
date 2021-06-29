export { bootstrapDirectory } from './bootstrap';

import { createLogger } from '@core-services/core-common';
import { Logger } from 'winston';
export * from './types';
export * from './repository';
export * from './model';
import * as passport from 'passport';
import { createRepositories } from './mongo';
import { environment } from '../environments/environment';
import { Application } from 'express';
import { Repositories } from './repository';
import { createDirectoryRouter } from './router/directory';

export const createDirectoryService = (app: Application) => {
  const logger = createLogger('directory-management-service', environment.LOG_LEVEL || 'info');

  Promise.all([createRepositories({ ...environment, logger })]).then(([repositories]) => {
    app.get('/directory-services/health', (req, res) =>
      res.json({
        db: repositories.isConnected(),
      })
    );

    applyConfigMiddleware(app, {
      ...repositories,
      logger,
    });
  });
};

const passportMiddleware = passport.authenticate(['jwt-tenant', 'jwt'], { session: false });

interface middlewareProps extends Repositories {
  logger: Logger;
}

const applyConfigMiddleware = (app: Application, { logger, directoryRepository }: middlewareProps): Application => {
  const directoryRouterProps = {
    logger,
    directoryRepository,
  };

  const directoryRouter = createDirectoryRouter(directoryRouterProps);

  app.use('/api/discovery/v1', passportMiddleware, directoryRouter);

  return app;
};
