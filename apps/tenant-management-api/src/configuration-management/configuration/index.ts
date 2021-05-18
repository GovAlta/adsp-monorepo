import * as fs from 'fs';
import { Application } from 'express';
import { Repositories } from './repository';
import { createConfigurationRouter, createTenantConfigurationRouter } from './router';
import { Logger } from 'winston';
export * from './types';
export * from './repository';
export * from './model';
import * as passport from 'passport';

const passportMiddleware = passport.authenticate(['jwt-tenant', 'jwt'], { session: false });

interface ConfigMiddlewareProps extends Repositories {
  logger: Logger;
}

export const applyConfigMiddleware = (
  app: Application,
  { logger, serviceConfigurationRepository, tenantConfigurationRepository }: ConfigMiddlewareProps
): Application => {
  const serviceConfigRouterProps = {
    logger,
    serviceConfigurationRepository,
  };

  const tenantConfigRouterProps = {
    logger,
    tenantConfigurationRepository,
  };

  const serviceConfigRouter = createConfigurationRouter(serviceConfigRouterProps);
  const tenantConfigRouter = createTenantConfigurationRouter(tenantConfigRouterProps);

  app.use('/api/configuration/v1/serviceOptions/', passportMiddleware, serviceConfigRouter);
  app.use('/api/configuration/v1/tenantConfig/', passportMiddleware, tenantConfigRouter);

  return app;
};
