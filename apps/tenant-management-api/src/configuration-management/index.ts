import { Application } from 'express';
import { createLogger } from '@core-services/core-common';
import { applyConfigMiddleware } from './configuration';
import { createRepositories } from './mongo';

const environment = {
  MONGO_URI: process.env.MONGO_URI,
  MONGO_DB: process.env.MONGO_DB,
  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
};

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
