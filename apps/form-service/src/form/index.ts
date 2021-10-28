import { EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
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
  logger: Logger;
  eventService: EventService;
  notificationService: NotificationService;
}

export const applyFormMiddleware = (
  app: Application,
  { logger, formRepository: repository, eventService, notificationService }: FormMiddlewareProps
): Application => {
  scheduleFormJobs({ logger, repository, eventService });

  const router = createFormRouter({ repository, eventService, notificationService });
  app.use('/form/v1', router);

  return app;
};
