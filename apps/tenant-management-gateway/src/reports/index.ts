import { Application } from 'express';
import { Logger } from 'winston';
import { createValueServiceClient } from './client';
import { createReportCatalog } from './handlers';
import { createReportsRouter } from './router';

export interface ReportsMiddlewareProps {
  logger: Logger;
  valueServiceUrl: string;
}

export function applyReportsMiddleware(
  app: Application,
  { logger, valueServiceUrl }: ReportsMiddlewareProps
): Application {
  const valueClient = createValueServiceClient({ valueServiceUrl });
  const catalog = createReportCatalog(valueClient);

  app.use('/api/tenant/v1', createReportsRouter({ logger, catalog }));

  return app;
}
