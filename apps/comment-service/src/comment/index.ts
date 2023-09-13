import { AdspId, EventService, adspId } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { createCommentRouter, createTopicRouter } from './router';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { TopicRepository } from './repository';

export * from './events';
export * from './model';
export * from './repository';
export * from './roles';
export * from './types';

interface CommentMiddlewareProps {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
  repository: TopicRepository;
}

export function applyCommentMiddleware(app: Application, { serviceId, ...props }: CommentMiddlewareProps): Application {
  const apiId = adspId`${serviceId}:v1`;
  const commentRouter = createCommentRouter(props);
  const topicRouter = createTopicRouter({ ...props, apiId });

  app.use('/comment/v1', assertAuthenticatedHandler, [commentRouter, topicRouter]);

  return app;
}
