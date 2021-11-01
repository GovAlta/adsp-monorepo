import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { FileService } from '../file';
import { NotificationService } from '../notification';
import { scheduleFormJobs } from './jobs';
import { Repositories } from './repository';
import { createFormRouter } from './router';

export * from './roles';
export * from './configuration';
export * from './model';
export * from './types';
export * from './repository';
export * from './events';
export * from './notifications';

interface FormMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
  notificationService: NotificationService;
  fileService: FileService;
}

export const applyFormMiddleware = (
  app: Application,
  { serviceId, logger, formRepository: repository, eventService, notificationService, fileService }: FormMiddlewareProps
): Application => {
  scheduleFormJobs({ logger, repository, eventService, fileService });

  const router = createFormRouter({ serviceId, repository, eventService, notificationService, fileService });
  app.use('/form/v1', router);

  return app;
};
