import { ServiceDirectory, TenantService, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { createDocsRouter } from './router';
import { createServiceDocs } from './serviceDocs';
import { connectEntryUpdateSubscription } from './entryUpdateSubscription';
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

  serviceDocs.getDocs(adspId`urn:ads:platform`).catch((err) => props.logger.warn(`Failed pre-loading platform docs: ${err.message}`));
  schedule.scheduleJob('0 23 * * *', createFetchJob({ ...props, serviceDocs }));
  connectEntryUpdateSubscription({ ...props, serviceDocs }).catch((err) =>
    props.logger.warn(`Failed connecting to directory entry updates stream: ${err.message}`)
  );

  const docsRouter = await createDocsRouter({ ...props, serviceDocs });
  app.use('/', docsRouter);
  return app;
};
