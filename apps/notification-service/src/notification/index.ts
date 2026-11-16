import { Application } from 'express';
import { Logger } from 'winston';
import {
  AdspId,
  AuditService,
  ConfigurationService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, DomainEventSubscriberService, WorkQueueService } from '@core-services/core-common';
import { createNotificationAuditor } from './audit';
import { Repositories } from './repository';
import { createJobs } from './job';
import { TemplateService } from './template';
import { NotificationWorkItem, Providers } from './types';
import { createSubscriptionRouter } from './router';
import { VerifyService } from './verify';

export * from './types';
export * from './audit';
export * from './repository';
export * from './model';
export * from './template';
export * from './events';
export * from './configuration';
export * from './file';
export * from './verify';

interface NotificationMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  tenantService: TenantService;
  directory: ServiceDirectory;
  eventService: EventService;
  auditService: AuditService;
  eventSubscriber: DomainEventSubscriberService;
  queueService: WorkQueueService<NotificationWorkItem>;
  verifyService: VerifyService;
  providers: Providers;
}

export const applyNotificationMiddleware = (
  app: Application,
  {
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    directory,
    eventService,
    auditService,
    subscriptionRepository,
    tenantService,
    eventSubscriber,
    queueService,
    verifyService,
    providers,
  }: NotificationMiddlewareProps
): Application => {
  const auditor = createNotificationAuditor(auditService, logger);

  createJobs({
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    directory,
    eventService,
    auditor,
    tenantService,
    events: eventSubscriber.getItems(),
    queueService,
    subscriptionRepository,
    providers,
  });

  const routerProps = {
    serviceId,
    logger,
    subscriptionRepository,
    eventService,
    auditor,
    verifyService,
    tenantService,
    directory,
    tokenProvider,
    configurationService,
  };
  const subscriptionRouter = createSubscriptionRouter(routerProps);

  app.use('/subscription/v1', assertAuthenticatedHandler, subscriptionRouter);

  return app;
};
