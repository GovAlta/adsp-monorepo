import { Application } from 'express';
import { Logger } from 'winston';
import { EventService } from '@abgov/adsp-service-sdk';
import { Repositories } from './repository';
import { createFileRouter } from './router';
import { scheduleFileJobs } from './job';
import { FileStorageProvider } from './storage';
import { ScanService } from './scan';

export * from './types';
export * from './repository';
export * from './model';
export * from './events';
export * from './configuration';
export * from './scan';
export * from './storage';

interface FileMiddlewareProps extends Repositories {
  logger: Logger;
  eventService: EventService;
  storageProvider: FileStorageProvider;
  scanService: ScanService;
}

export const applyFileMiddleware = (app: Application, { scanService, ...props }: FileMiddlewareProps): Application => {
  const fileRouter = createFileRouter(props);

  scheduleFileJobs({ ...props, scanService });

  app.use('/file/v1', fileRouter);

  return app;
};
