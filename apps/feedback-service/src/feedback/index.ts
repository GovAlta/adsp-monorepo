import { WorkQueueService, assertAuthenticatedHandler } from '@core-services/core-common';
import { Application } from 'express';
import { Logger } from 'winston';
import { FeedbackWorkItem, createFeedbackJobs } from './job';
import { PiiService } from './pii';
import { createFeedbackRouter } from './router';
import { ValueService } from './value';

export * from './job';
export * from './pii';
export * from './roles';
export * from './types';
export * from './value';

interface MiddlewareProps {
  logger: Logger;
  piiService: PiiService;
  valueService: ValueService;
  queueService: WorkQueueService<FeedbackWorkItem>;
}

export function applyFeedbackMiddleware(app: Application, props: MiddlewareProps) {
  createFeedbackJobs(props);

  const feedbackRouter = createFeedbackRouter(props);
  app.use('/feedback/v1', assertAuthenticatedHandler, feedbackRouter);
}
