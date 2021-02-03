import * as fs from 'fs';
import { Application } from 'express';
import { Repositories } from './repository';
import { createConfigurationRouter } from './router';
import { Logger } from 'winston';

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

  const serviceConfigRouter = createConfigurationRouter(serviceConfigRouterProps);

  app.use('/configuration/v1/', serviceConfigRouter);
  
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
