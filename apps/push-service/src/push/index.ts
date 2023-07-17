import { Application } from 'express';
import { Logger } from 'winston';
import { DomainEventSubscriberService } from '@core-services/core-common';
import { createStreamRouter } from './router';
import { Namespace as IoNamespace } from 'socket.io';
import {
  TenantService,
  ConfigurationService,
  ServiceDirectory,
  TokenProvider,
  EventService,
  AdspId,
} from '@abgov/adsp-service-sdk';

export * from './configuration';
export * from './types';
export * from './model';
export * from './roles';

interface PushMiddlewareProps {
  logger: Logger;
  eventServiceAmp: DomainEventSubscriberService;
  eventServiceAmpWebhooks: DomainEventSubscriberService;
  tenantService: TenantService;
  configurationService: ConfigurationService;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  serviceId: AdspId;
}

export const applyPushMiddleware = (app: Application, ios: IoNamespace[], props: PushMiddlewareProps): Application => {
  const streamRouter = createStreamRouter(ios, props);
  app.use('/stream/v1', streamRouter);

  return app;
};
