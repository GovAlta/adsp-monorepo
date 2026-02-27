import { Application } from 'express';
import { Logger } from 'winston';
import { createCronJobRouter } from './router';
import { CronJobService } from './cronJobService';
import {
  TenantService,
  ConfigurationService,
  ServiceDirectory,
  TokenProvider,
  EventService,
  AdspId,
} from '@abgov/adsp-service-sdk';
export * from './roles';
export * from './configuration';
export * from './cronJobService';

interface CronJobMiddlewareProps {
  logger: Logger;
  tenantService: TenantService;
  configurationService: ConfigurationService;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  serviceId: AdspId;
  cronJobService: CronJobService;
}

export const applyCronJobMiddleware = (app: Application, props: CronJobMiddlewareProps): Application => {
  const streamRouter = createCronJobRouter(props);
  app.use('/cron-job/v1', streamRouter);

  return app;
};
