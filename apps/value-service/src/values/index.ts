import { Application } from 'express';
import { Logger } from 'winston';
import { EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk'; // clean-code-ignore: RULE-19 — wiring only; routes are covered in router/definition.spec.ts.
import { ValidationService } from '@core-services/core-common';
import { DefinitionConfigurationClient } from './definitionClient';
import { ServiceMetricRollupRepository, ValuesRepository } from './repository';
import { createDefinitionRouter, createValueRouter } from './router';

export * from './types';
export * from './model';
export * from './repository';
export * from './events';
export * from './configuration';
export * from './definitionClient';

interface ValuesMiddlewareProps {
  logger: Logger;
  repository: ValuesRepository;
  serviceMetricRollupRepository: ServiceMetricRollupRepository;
  serviceMetricRollupTrailingDays: number;
  eventService: EventService;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  validationService: ValidationService;
}

export const applyValuesMiddleware = (app: Application, props: ValuesMiddlewareProps): Application => {
  const definitionRouter = createDefinitionRouter({
    client: new DefinitionConfigurationClient(props.directory, props.tokenProvider),
    validationService: props.validationService,
  });
  const valueRouter = createValueRouter(props);
  // Definition routes are registered first so that /definitions/... is not read as a value namespace.
  app.use('/value/v1/', definitionRouter);
  app.use('/value/v1/', valueRouter);

  return app;
};
