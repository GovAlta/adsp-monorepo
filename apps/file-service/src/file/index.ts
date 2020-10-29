import * as fs from 'fs';
import { Application } from 'express';
import { Logger } from 'winston';
import { DomainEventService } from '@core-services/core-common';
import { Repositories } from './repository';
import { createSpaceRouter, createFileRouter, createAdminRouter } from './router';
import { scheduleFileJobs } from './job';
import { createScanService } from './scan';

export * from './types';
export * from './repository';
export * from './model';

interface FileMiddlewareProps extends Repositories {
  logger: Logger
  rootStoragePath: string
  avProvider: string
  avHost: string
  avPort: number
  eventService: DomainEventService
}

export const applyFileMiddleware = (
  app: Application,
  props: FileMiddlewareProps
) => {
  const spaceRouter = createSpaceRouter(props);
  const adminRouter = createAdminRouter(props);
  const fileRouter = createFileRouter(props);
  
  const scanService = createScanService(
    props.avProvider, 
    {
      rootStoragePath: props.rootStoragePath, 
      host: props.avHost, 
      port: props.avPort
    }
  );

  scheduleFileJobs({...props, scanService});
  
  app.use('/space/v1', spaceRouter);
  app.use('/file-admin/v1', adminRouter);
  app.use('/file/v1', fileRouter);

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
