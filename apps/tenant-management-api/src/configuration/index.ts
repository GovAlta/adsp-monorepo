import { EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import * as passport from 'passport';
import { Logger } from 'winston';
import { Repositories } from './repository';
import { createConfigurationRouter, createTenantConfigurationRouter } from './router';

export * from './types';
export * from './events';
export * from './model';
export * from './repository';


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
