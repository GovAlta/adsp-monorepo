import {
  adspId,
  TenantService,
  UnauthorizedUserError,
  User,
  TokenProvider,
  EventService,
  ConfigurationService,
  AdspId,
} from '@abgov/adsp-service-sdk';

import 'compression'; // For unit tests to load the type extensions.
import { NextFunction, Request, RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { CronJobServiceConfiguration } from '../configuration';
import { CronJobConfig } from '../types';

interface CronJobRouterProps {
  logger: Logger;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  eventService: EventService;
  configurationService: ConfigurationService;
  serviceId: AdspId;
}

export const getCronJobs = async (
  logger: Logger,
  tenantService: TenantService,
  req: Request,
  res,
  next: NextFunction,
) => {
  const user = req.user as User;
  const tenant = req.query.tenant as string;
  logger.info(`Get the tenant: ${tenant}`);
  //const tenantId = (tenant && (await tenantService.getTenantByName(tenant.replace(/-/g, ' '))))?.id || user?.tenantId;
  const tenants = await tenantService.getTenants();
  const getCronJobsPromises = tenants.map(async (tenant) => {
    return await req.getConfiguration<{ jobs: Record<string, CronJobConfig> }, { jobs: Record<string, CronJobConfig> }>(
      tenant.id,
    );
  });

  const cronJobs = await Promise.all(getCronJobsPromises);

  res.send(cronJobs);
};
export const createCronJobRouter = ({
  logger,
  tenantService,
  tokenProvider,
  eventService,
  configurationService,
  serviceId,
}: CronJobRouterProps): Router => {
  const cronJobRouter = Router();
  cronJobRouter.get('/jobs', (req, _res, next) => getCronJobs(logger, tenantService, req, _res, next));

  return cronJobRouter;
};
