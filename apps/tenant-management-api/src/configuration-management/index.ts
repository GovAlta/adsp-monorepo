import { Application } from 'express';
import { createLogger } from '@core-services/core-common';
import { ServiceRegistration, ServiceRegistrationImpl } from './registration';
import { createRepositories } from './mongo';
import { environment } from '../environments/environment';
import { applyConfigMiddleware } from './configuration';
import { EventService } from '@abgov/adsp-service-sdk';

export type { ServiceClient, ServiceRegistration } from './registration';
export * from './events';

const logger = createLogger('configuration-management-service', environment.LOG_LEVEL || 'info');

const repositoriesPromise = createRepositories({ ...environment, logger });
export const createServiceRegistration = async (): Promise<ServiceRegistration> => {
  const { serviceConfigurationRepository } = await repositoriesPromise;
  return new ServiceRegistrationImpl(serviceConfigurationRepository);
};

export const createConfigService = async (app: Application, eventService: EventService): Promise<Application> => {
  const repositories = await repositoriesPromise;
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
