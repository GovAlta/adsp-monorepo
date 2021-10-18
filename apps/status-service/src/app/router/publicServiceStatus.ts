import { Router } from 'express';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { environment } from '../../environments/environment';
import { TenantService } from '@abgov/adsp-service-sdk';
export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  serviceStatusRepository: ServiceStatusRepository;
}

export function createPublicServiceStatusRouter({ logger, tenantService, serviceStatusRepository }: ServiceStatusRouterProps): Router {
  const router = Router();

  // Get the public service for the tenant
  router.get('/applications/:name', async (req, res, next) => {
    logger.info(req.method, req.url);
    const { name } = req.params;
    const searchName = name || environment.PLATFORM_TENANT_REALM;
    const invalidChars = [
      '!',
      '*',
      "'",
      '(',
      ')',
      ';',
      ':',
      '@',
      '&',
      '=',
      '+',
      '$',
      ',',
      '/',
      '?',
      '%',
      '?',
      '#',
      '[',
      ']',
      '-',
    ];

    invalidChars.forEach((char) => {
      if (name.indexOf(char) !== -1) {
        res.json([]);
      }
    });

    let applications: ServiceStatusApplicationEntity[] = [];
    try {
      applications = await serviceStatusRepository.find({
        tenantId: (await tenantService
          .getTenants())
          .filter((tenant) => { return tenant.name === searchName })[0]
          .id.toString()
      });
      res.json(applications);
    } catch (err) {
      const errMessage = `Error getting applications: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  return router;
}
