import { Logger } from 'winston';
export * from '../directory/types';
export * from '../directory/repository';
import { Application } from 'express';
import { Repositories } from '../directory/repository';
import { createDirectoryRouter, createResourceRouter } from './router';
import {
  TenantService,
  EventService,
  ConfigurationService,
  AdspId,
  ServiceDirectory,
  TokenProvider,
  adspId,
} from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, DomainEvent, WorkQueueService } from '@core-services/core-common';
import { createDirectoryJobs } from './job';

export * from './bootstrap';
export * from './configuration';
export * from './directory';
export * from './events';
export * from './job';
export * from './model';
export * from './repository';
export * from './roles';
export * from './types';

interface DirectoryMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
  eventService: EventService;
  configurationService: ConfigurationService;
  queueService: WorkQueueService<DomainEvent>;
}

export const applyDirectoryMiddleware = (
  app: Application,
  {
    serviceId,
    logger,
    directory,
    directoryRepository,
    tokenProvider,
    tenantService,
    eventService,
    configurationService,
    queueService,
  }: DirectoryMiddlewareProps
): Application => {
  const apiId = adspId`${serviceId}:resource-v1`;

  const directoryRouter = createDirectoryRouter({
    logger,
    directoryRepository,
    tenantService,
    eventService,
  });

  const resourceRouter = createResourceRouter({
    logger,
    apiId,
    directory,
    eventService,
    repository: directoryRepository,
  });

  app.use('/directory/v2', directoryRouter);
  app.use('/resource/v1', assertAuthenticatedHandler, resourceRouter);

  createDirectoryJobs({ apiId, logger, tokenProvider, configurationService, eventService, queueService });

  return app;
};
