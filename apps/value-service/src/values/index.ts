import { Application } from 'express';
import { Logger } from 'winston';
import { EventService } from '@abgov/adsp-service-sdk';
import { ValuesRepository } from './repository';
import { createValueRouter } from './router';

export * from './types';
export * from './model';
export * from './repository';
export * from './events';
export * from './configuration';

interface ValuesMiddlewareProps {
  logger: Logger;
  repository: ValuesRepository;
  eventService: EventService;
}

export const applyValuesMiddleware = (app: Application, props: ValuesMiddlewareProps): Application => {
  const valueRouter = createValueRouter(props);
  app.use('/value/v1/', valueRouter);

  return app;
};
