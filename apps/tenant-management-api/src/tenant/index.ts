import { EventService } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { Application, RequestHandler } from 'express';
import * as passport from 'passport';
import { Logger } from 'winston';
import { TenantRepository } from './repository';
import { createTenantRouter, createTenantV2Router } from './router';
import * as tenantService from './services';
export { tenantService };
export * from './configuration';
export * from './events';
export * from './models';
export * from './repository';

interface TenantMiddlewareProps {
  logger: Logger;
  tenantRepository: TenantRepository;
  eventService: EventService;
  configurationHandler: RequestHandler;
}

export function applyTenantMiddleware(
  app: Application,
  { tenantRepository, configurationHandler, eventService }: TenantMiddlewareProps
): Application {
  const tenantRouter = createTenantRouter({ tenantRepository, eventService });
  const tenantV2Router = createTenantV2Router({ tenantRepository });
  const authenticate = passport.authenticate(['jwt', 'jwt-tenant'], { session: false });
  app.use('/api/tenant/v1', authenticate, configurationHandler, tenantRouter);
  app.use('/api/tenant/v2', authenticate, assertAuthenticatedHandler, tenantV2Router);

  return app;
}
