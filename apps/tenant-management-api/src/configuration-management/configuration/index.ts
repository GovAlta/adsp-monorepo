import * as fs from 'fs';
import { Application } from 'express';
import { Repositories } from './repository';
import { createConfigurationRouter, createTenantConfigurationRouter } from './router';
import { Logger } from 'winston';
import { errorHandler } from './errorHandlers';
export * from './types';
export * from './repository';
export * from './model';

interface ConfigMiddlewareProps extends Repositories {
  logger: Logger;
}

export const applyConfigMiddleware = (
  app: Application,
  {
    logger,
    serviceConfigurationRepository,
    tenantConfigurationRepository
  }: ConfigMiddlewareProps
) => {

  const serviceConfigRouterProps = {
    logger,
    serviceConfigurationRepository
  }

  const tenantConfigRouterProps = {
    logger,
    tenantConfigurationRepository
  }

  const serviceConfigRouter = createConfigurationRouter(serviceConfigRouterProps);
  const tenantConfigRouter = createTenantConfigurationRouter(tenantConfigRouterProps);

  app.use('/api/configuration/v1/serviceOptions/', serviceConfigRouter);
  app.use('/api/configuration/v1/tenantConfig/', tenantConfigRouter);

  app.use(errorHandler);

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
}
