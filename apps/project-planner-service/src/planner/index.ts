import { AdspId, adspId, EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { SolutionRepository } from './repository';
import { createPlannerRouter } from './router';

export * from './analysis';
export * from './configuration';
export * from './events';
export * from './patterns';
export * from './repository';
export * from './roles';
export * from './specialists';
export * from './types';

interface PlannerMiddlewareProps {
  serviceId: AdspId;
  logger: Logger;
  solutionRepository: SolutionRepository;
  eventService: EventService;
}

export function applyPlannerMiddleware(app: Application, { serviceId, ...props }: PlannerMiddlewareProps): Application {
  const apiId = adspId`${serviceId}:v1`;
  app.use('/planner/v1', createPlannerRouter({ apiId, ...props }));
  return app;
}
