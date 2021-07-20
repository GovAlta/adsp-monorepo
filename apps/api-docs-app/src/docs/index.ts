import { ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { createDocsRouter } from './router';
import { createServiceDocs } from './serviceDocs';

interface MiddlewareProps {
  logger: Logger;
  accessServiceUrl: URL;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
}

export const applyDocsMiddleware = async (app: Application, props: MiddlewareProps): Promise<Application> => {
  const serviceDocs = createServiceDocs(props);
  const docsRouter = await createDocsRouter({ ...props, serviceDocs });
  app.use('/', docsRouter);
  return app;
};
