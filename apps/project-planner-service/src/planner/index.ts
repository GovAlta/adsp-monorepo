import { EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { PlannerLlm } from './llm';
import { PatternRepository, SolutionRepository, SpecialistChatRepository } from './repository';
import { createPlannerRouter } from './router';

export * from './analysis';
export * from './configuration';
export * from './discovery';
export * from './documentExtract';
export * from './blueprint';
export * from './components';
export * from './events';
export * from './llm';
export * from './patterns';
export * from './repository';
export * from './roles';
export * from './specialists';
export * from './types';
export * from './versioning';

interface PlannerMiddlewareProps {
  logger: Logger;
  solutionRepository: SolutionRepository;
  patternRepository: PatternRepository;
  specialistChatRepository: SpecialistChatRepository;
  eventService: EventService;
  llm?: PlannerLlm;
  readAdspCatalog?: () => Promise<string[]>;
}

export function applyPlannerMiddleware(app: Application, props: PlannerMiddlewareProps): Application {
  app.use('/planner/v1', createPlannerRouter(props));
  return app;
}
