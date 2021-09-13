import { EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { TaskRepository } from './repository';
import { createQueueRouter, createTaskRouter } from './router';

export * from './configuration';
export * from './roles';
export * from './types';
export * from './model';
export * from './repository';

interface TaskMiddlewareProps {
  KEYCLOAK_ROOT_URL: string;
  logger: Logger;
  taskRepository: TaskRepository;
  eventService: EventService;
}
export function applyTaskMiddleware(app: Application, props: TaskMiddlewareProps): Application {
  const queueRouter = createQueueRouter(props);
  const taskRouter = createTaskRouter(props);
  app.use('/task/v1/', [taskRouter, queueRouter]);

  return app;
}
