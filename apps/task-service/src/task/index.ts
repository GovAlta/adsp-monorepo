import { AdspId, adspId, EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { TaskRepository } from './repository';
import { createQueueRouter, createTaskRouter } from './router';
import { CommentService } from './comment';

export * from './configuration';
export * from './events';
export * from './roles';
export * from './types';
export * from './model';
export * from './repository';
export * from './comment';

interface TaskMiddlewareProps {
  KEYCLOAK_ROOT_URL: string;
  serviceId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  taskRepository: TaskRepository;
  eventService: EventService;
  commentService: CommentService;
}
export function applyTaskMiddleware(app: Application, { serviceId, ...props }: TaskMiddlewareProps): Application {
  const apiId = adspId`${serviceId}:v1`;
  const queueRouter = createQueueRouter({ apiId, ...props });
  const taskRouter = createTaskRouter({ apiId, ...props });
  app.use('/task/v1/', [taskRouter, queueRouter]);

  return app;
}
