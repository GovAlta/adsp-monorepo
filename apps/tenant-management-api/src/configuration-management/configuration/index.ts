import { Application } from 'express';
import { Repositories } from './repository';
import { createConfigurationRouter, createTenantConfigurationRouter } from './router';
import { Logger } from 'winston';
export * from './types';
export * from './repository';
export * from './model';
import * as passport from 'passport';
import { EventService } from '@abgov/adsp-service-sdk';

const passportMiddleware = passport.authenticate(['jwt', 'jwt-tenant'], { session: false });

interface ConfigMiddlewareProps extends Repositories {
  logger: Logger;
  eventService: EventService;
}

export const applyConfigMiddleware = (
  app: Application,
  { logger, eventService, serviceConfigurationRepository, tenantConfigurationRepository }: ConfigMiddlewareProps
): Application => {
  const serviceConfigRouterProps = {
    logger,
    serviceConfigurationRepository,
  };

  const tenantConfigRouterProps = {
    logger,
    eventService,
    tenantConfigurationRepository,
  };

  const serviceConfigRouter = createConfigurationRouter(serviceConfigRouterProps);
  const tenantConfigRouter = createTenantConfigurationRouter(tenantConfigRouterProps);

  app.use('/api/configuration/v1/serviceOptions/', passportMiddleware, serviceConfigRouter);
  app.use('/api/configuration/v1/tenantConfig/', passportMiddleware, tenantConfigRouter);

  return app;
};
