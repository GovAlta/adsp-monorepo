import { AdspId, adspId, EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { TaskRepository } from './repository';
import { createQueueRouter, createTaskRouter } from './router';

export * from './configuration';
export * from './events';
export * from './roles';
export * from './types';
export * from './model';
export * from './repository';

interface TaskMiddlewareProps {
  KEYCLOAK_ROOT_URL: string;
  serviceId: AdspId;
  logger: Logger;
  taskRepository: TaskRepository;
  eventService: EventService;
}
export function applyTaskMiddleware(app: Application, { serviceId, ...props }: TaskMiddlewareProps): Application {
  const apiId = adspId`${serviceId}:v1`;
  const queueRouter = createQueueRouter({ apiId, ...props });
  const taskRouter = createTaskRouter({ apiId, ...props });
  app.use('/task/v1/', [taskRouter, queueRouter]);

  return app;
}
