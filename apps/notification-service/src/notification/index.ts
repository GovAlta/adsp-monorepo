import * as fs from 'fs';
import { Application } from 'express';
import { Logger } from 'winston';
import { DomainEventSubscriberService, EventServiceClient, WorkQueueService } from '@core-services/core-common';
import { Repositories } from './repository';
import { createJobs } from './job';
import { TemplateService } from './template';
import { Notification, Providers } from './types';
import { createSpaceRouter, createAdminRouter, createSubscriptionRouter } from './router';

export * from './types';
export * from './repository';
export * from './model';
export * from './template';

interface NotificationMiddlewareProps extends Repositories {
  logger: Logger;
  templateService: TemplateService;
  eventService: EventServiceClient;
  eventSubscriber: DomainEventSubscriberService;
  queueService: WorkQueueService<Notification>;
  providers: Providers;
}

export const applyNotificationMiddleware = (
  app: Application,
  {
    logger,
    spaceRepository,
    typeRepository,
    subscriptionRepository,
    templateService,
    eventService,
    eventSubscriber,
    queueService,
    providers,
  }: NotificationMiddlewareProps
) => {
  createJobs({
    logger,
    templateService,
    eventService,
    events: eventSubscriber.getEvents(),
    queueService,
    typeRepository,
    subscriptionRepository,
    providers,
  });

  const routerProps = {
    logger,
    spaceRepository,
    typeRepository,
    subscriptionRepository,
  };
  const spaceRouter = createSpaceRouter(routerProps);
  const adminRouter = createAdminRouter(routerProps);
  const subscriptionRouter = createSubscriptionRouter(routerProps);

  app.use('/space/v1', spaceRouter);
  app.use('/notification-admin/v1', adminRouter);
  app.use('/subscription/v1', subscriptionRouter);

  let swagger = null;
  app.use('/swagger/docs/v1', (req, res) => {
    if (swagger) {
      res.json(swagger);
    } else {
      fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          swagger = JSON.parse(data);
          res.json(swagger);
        }
      });
    }
  });
};
