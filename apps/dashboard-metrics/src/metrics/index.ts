import { ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { createMetricsJobs } from './job';
import { MetricsRepository } from './repository';
import { createMetricsRouter } from './router';

export * from './repository';

interface MetricsMiddlewareProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
  repository: MetricsRepository;
  initializeJobs: boolean;
}

export function applyMetricsMiddleware(app: Application, props: MetricsMiddlewareProps) {
  const router = createMetricsRouter(props);
  app.use('/metrics/v1', router);

  if (props.initializeJobs) {
    createMetricsJobs(props);
  }
}
