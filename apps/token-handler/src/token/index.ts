import { EventService, ServiceDirectory, TenantService } from '@abgov/adsp-service-sdk';
import { Application, RequestHandler } from 'express';
import { PassportStatic } from 'passport';
import { Logger } from 'winston';

import { createClientRouter, createTargetRouter } from './router';
import { createSessionRouter } from './router/session';
import { Store as SessionStore } from 'express-session';

export * from './configuration';
export * from './events';
export * from './model';
export * from './repository';
export * from './roles';
export * from './types';

interface MiddlewareOptions {
  logger: Logger;
  configurationHandler: RequestHandler;
  directory: ServiceDirectory;
  eventService: EventService;
  passport: PassportStatic;
  sessionStore: SessionStore;
  tenantHandler: RequestHandler;
  tenantService: TenantService;
}

export function applyTokenHandlerMiddleware(
  app: Application,
  {
    configurationHandler,
    directory,
    eventService,
    passport,
    sessionStore,
    tenantHandler,
    tenantService,
  }: MiddlewareOptions
) {
  const clientRouter = createClientRouter({
    configurationHandler,
    eventService,
    passport,
    tenantHandler,
    tenantService,
  });
  const targetRouter = createTargetRouter({ configurationHandler, directory });
  const sessionRouter = createSessionRouter({ passport, sessionStore });

  app.use('/token-handler/v1', [clientRouter, targetRouter, sessionRouter]);
}
