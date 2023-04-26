import { Application } from 'express';
import { Logger } from 'winston';
import { AdspId, ConfigurationService, EventService, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { Repositories } from './repository';
import { createFileRouter } from './router';
import { createFileJobs, FileServiceWorkItem } from './job';
import { FileStorageProvider } from './storage';
import { ScanService } from './scan';
import { WorkQueueService } from '@core-services/core-common';

export * from './types';
export * from './repository';
export * from './model';
export * from './events';
export * from './configuration';
export * from './scan';
export * from './storage';
export * from './job';

interface FileMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
  storageProvider: FileStorageProvider;
  queueService: WorkQueueService<FileServiceWorkItem>;
  tenantService: TenantService;
  configurationService: ConfigurationService;
  tokenProvider: TokenProvider;
}

export const applyFileMiddleware = (app: Application, { ...props }: FileMiddlewareProps): Application => {
  const fileRouter = createFileRouter(props);

  createFileJobs(props);

  app.use('/file/v1', fileRouter);

  return app;
};
