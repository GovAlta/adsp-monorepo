import { Application } from 'express';
import { Instance as WsApplication } from 'express-ws';
import { Logger } from 'winston';
import { DomainEventSubscriberService } from '@core-services/core-common';
import { Repositories } from './repository';
import { createStreamRouter } from './router';
import { createSpaceRouter } from './router/space';
import { createAdminRouter } from './router/admin';

export * from './types';
export * from './model';
export * from './repository';

interface PushMiddlewareProps extends Repositories {
  logger: Logger
  eventService: DomainEventSubscriberService
}

export const applyPushMiddleware = (
  app: Application,
  ws: WsApplication,
  props: PushMiddlewareProps
) => {
  
  const spaceRouter = createSpaceRouter(props);
  const adminRouter = createAdminRouter(props);
  const streamRouter = createStreamRouter(ws, props);

  app.use('/space/v1', spaceRouter);
  app.use('/push-admin/v1', adminRouter);
  app.use('/stream/v1', streamRouter);
  
  return app;
}
