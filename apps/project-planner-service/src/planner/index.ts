import { AdspId, adspId, EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { PlannerLlm } from './llm';
import { PatternRepository, SolutionRepository, SpecialistChatRepository } from './repository';
import { createPlannerRouter } from './router';

export * from './analysis';
export * from './configuration';
export * from './discovery';
export * from './events';
export * from './llm';
export * from './patterns';
export * from './repository';
export * from './roles';
export * from './specialists';
export * from './types';

interface PlannerMiddlewareProps {
  serviceId: AdspId;
  logger: Logger;
  solutionRepository: SolutionRepository;
  patternRepository: PatternRepository;
  specialistChatRepository: SpecialistChatRepository;
  eventService: EventService;
  llm?: PlannerLlm;
}

export function applyPlannerMiddleware(app: Application, { serviceId, ...props }: PlannerMiddlewareProps): Application {
  const apiId = adspId`${serviceId}:v1`;
  app.use('/planner/v1', createPlannerRouter({ apiId, ...props }));
  return app;
}
