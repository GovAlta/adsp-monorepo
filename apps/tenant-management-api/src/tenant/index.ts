import { EventService } from '@abgov/adsp-service-sdk';
import { Application, RequestHandler } from 'express';
import * as passport from 'passport';
import { Logger } from 'winston';
import { TenantRepository } from './repository';
import { createTenantRouter, createTenantV2Router } from './router';
import { RealmService } from './services';
export * from './configuration';
export * from './events';
export * from './models';
export * from './repository';
export * from './roles';
export * from './services';
export * from './types';

interface TenantMiddlewareProps {
  logger: Logger;
  tenantRepository: TenantRepository;
  eventService: EventService;
  configurationHandler: RequestHandler;
  realmService: RealmService;
}

export function applyTenantMiddleware(
  app: Application,
  { logger, tenantRepository, configurationHandler, eventService, realmService }: TenantMiddlewareProps
): Application {
  const tenantRouter = createTenantRouter({ tenantRepository, eventService, realmService });
  const tenantV2Router = createTenantV2Router({ logger, tenantRepository, realmService, eventService });

  app.use(
    '/api/tenant/v1',
    passport.authenticate(['jwt', 'jwt-tenant'], { session: false }),
    configurationHandler,
    tenantRouter
  );
  app.use(
    '/api/tenant/v2',
    passport.authenticate(['jwt', 'jwt-tenant', 'anonymous'], { session: false }),
    configurationHandler,
    tenantV2Router
  );

  return app;
}
