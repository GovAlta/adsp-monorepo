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
  router.get('/applications/:realm', async (req, res) => {
    logger.info(req.method, req.url);
    const { realm } = req.params;
    const searchRealm = realm || environment.PLATFORM_TENANT_REALM;

    let applications: ServiceStatusApplicationEntity[] = [];

    applications = await serviceStatusRepository.find({
      tenantRealm: searchRealm,
    });

    res.json(applications);
  });

  return router;
}
