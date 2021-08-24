import { Application } from 'express';
import { createLogger } from '@core-services/core-common';
import { createRepositories } from './mongo';
import { environment } from '../environments/environment';
import { applyConfigMiddleware } from './configuration';
import { EventService } from '@abgov/adsp-service-sdk';

export * from './events';

const logger = createLogger('configuration-management-service', environment.LOG_LEVEL || 'info');

export const createConfigService = async (app: Application, eventService: EventService): Promise<Application> => {
  const repositories = await createRepositories({ ...environment, logger });
  app.get('/configuration/health', (req, res) =>
    res.json({
      db: repositories.isConnected(),
    })
  );

  applyConfigMiddleware(app, {
    ...repositories,
    logger,
    eventService,
  });

  return app;
};
