import { WorkQueueService } from '@core-services/core-common';
import { Application } from 'express';
import { Logger } from 'winston';
import { FeedbackWorkItem, createFeedbackJobs } from './job';
import { PiiService } from './pii';
import { createFeedbackRouter } from './router';
import { ValueService } from './value';
import { ConfigurationService, TenantService } from '@abgov/adsp-service-sdk';
import { Config } from 'winston/lib/winston/config';
import { FeedbackSiteService } from './feedbackSiteService';

export * from './configuration';
export * from './job';
export * from './pii';
export * from './roles';
export * from './types';
export * from './value';

interface MiddlewareProps {
  logger: Logger;
  piiService: PiiService;
  tenantService: TenantService;
  valueService: ValueService;
  feedbackSiteService: FeedbackSiteService;
  queueService: WorkQueueService<FeedbackWorkItem>;
}

export async function applyFeedbackMiddleware(app: Application, props: MiddlewareProps) {
  createFeedbackJobs(props);

  const feedbackRouter = await createFeedbackRouter(props);
  app.use('/feedback/v1', feedbackRouter);
}
