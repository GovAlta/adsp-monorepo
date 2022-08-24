import { Application, RequestHandler } from 'express';
import { Logger } from 'winston';
import { Repositories } from './repository';
import { createServiceStatusRouter } from './router/serviceStatus';
import { createPublicServiceStatusRouter } from './router/publicServiceStatus';
import { createNoticeRouter } from './router/notice';
import { TenantService, EventService } from '@abgov/adsp-service-sdk';
export * from './model';
export * from './repository';
export * from './types';


interface HealthMiddlewareProps extends Repositories {
  logger: Logger;
  authenticate: RequestHandler;
  eventService: EventService;
  tenantService: TenantService;
}

export const bindEndpoints = (app: Application, props: HealthMiddlewareProps): void => {
  // bind all service endpoints
  app.use('/status/v1', [props.authenticate], createServiceStatusRouter(props));
  app.use('/public_status/v1', createPublicServiceStatusRouter(props));
  app.use('/notice/v1', [props.authenticate], createNoticeRouter(props));
};
