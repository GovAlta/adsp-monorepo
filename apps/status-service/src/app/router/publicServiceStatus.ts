import { Router } from 'express';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { environment } from '../../environments/environment';

export interface ServiceStatusRouterProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
}

export function createPublicServiceStatusRouter({ logger, serviceStatusRepository }: ServiceStatusRouterProps): Router {
  const router = Router();

  // Get the public service for the tenant
  router.get('/applications/:name', async (req, res) => {
    logger.info(req.method, req.url);
    const { name } = req.params;
    const searchName = name || environment.PLATFORM_TENANT_REALM;

    let applications: ServiceStatusApplicationEntity[] = [];

    applications = await serviceStatusRepository.find({
      tenantName: { $regex: '^' + searchName + '\\b', $options: 'i' },
    });

    res.json(applications);
  });

  return router;
}
