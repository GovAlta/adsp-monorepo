import { ServiceDirectory, TenantService, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { createDocsRouter } from './router';
import { createServiceDocs } from './serviceDocs';
import { createFetchJob } from '../job';
import * as schedule from 'node-schedule';
interface MiddlewareProps {
  logger: Logger;
  accessServiceUrl: URL;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
}

export const applyDocsMiddleware = async (app: Application, props: MiddlewareProps): Promise<Application> => {
  const serviceDocs = createServiceDocs(props);

  //Pre-loading platform api docs and scheduling loading all docs for each tenant api doc in 11:00pm every night
  serviceDocs.getDocs(adspId`urn:ads:platform:service`);
  schedule.scheduleJob('0 23 * * *', createFetchJob({ ...props, serviceDocs }));
  const docsRouter = await createDocsRouter({ ...props, serviceDocs });
  app.use('/', docsRouter);
  return app;
};
