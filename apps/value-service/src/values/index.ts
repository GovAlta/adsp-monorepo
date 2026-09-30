import { Application } from 'express';
import { Logger } from 'winston';
import { EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk'; // clean-code-ignore: RULE-19 — wiring only; routes are covered in router/definition.spec.ts.
import { ConfigurationClient, ValidationService } from '@core-services/core-common';
import { ServiceMetricRollupRepository, ValuesRepository } from './repository';
import { createDefinitionRouter, createValueRouter } from './router';
import { ValueConfiguration } from './types';

export * from './types';
export * from './model';
export * from './repository';
export * from './events';
export * from './configuration';

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
    client: new ConfigurationClient<ValueConfiguration>(
      props.directory,
      props.tokenProvider,
      'platform',
      'value-service',
    ),
    validationService: props.validationService,
  });
  const valueRouter = createValueRouter(props);
  // Definition routes are registered first so that /definitions/... is not read as a value namespace.
  app.use('/value/v1/', definitionRouter);
  app.use('/value/v1/', valueRouter);

  return app;
};
