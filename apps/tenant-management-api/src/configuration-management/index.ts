import { Application } from 'express';
import { createLogger } from '@core-services/core-common';
import { applyConfigMiddleware } from './configuration';
import { createRepositories } from './mongo';
import { environment } from '../environments/environment';

export const createConfigService = (app: Application) => {
  const logger = createLogger('configuration-management-service', process.env.LOG_LEVEL || 'info');

  Promise.all([createRepositories({ ...environment, logger })]).then(([repositories]) => {
    app.get('/configuration/health', (req, res) =>
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
