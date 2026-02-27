import {
  TenantService,
  TokenProvider,
  EventService,
  ConfigurationService,
  AdspId,
} from '@abgov/adsp-service-sdk';

import { NextFunction, Request, Response, Router } from 'express';
import { Logger } from 'winston';
import { CronJobService } from '../cronJobService';

interface CronJobRouterProps {
  logger: Logger;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  eventService: EventService;
  configurationService: ConfigurationService;
  serviceId: AdspId;
  cronJobService: CronJobService;
}

export const getCronJobs = async (
  logger: Logger,
  tenantService: TenantService,
  cronJobService: CronJobService,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tenantName = req.query.tenant as string;
  logger.info(`Get cron jobs for tenant: ${tenantName}`);
  const tenant = await tenantService.getTenantByName(tenantName.replace(/-/g, ' '));
  const jobs = tenant ? cronJobService.getJobsByTenant(tenant.id) : [];
  res.send(jobs);
};
export const createCronJobRouter = ({ logger, tenantService, cronJobService }: CronJobRouterProps): Router => {
  const cronJobRouter = Router();
  cronJobRouter.get('/jobs', (req, res, next) => getCronJobs(logger, tenantService, cronJobService, req, res, next));

  return cronJobRouter;
};
