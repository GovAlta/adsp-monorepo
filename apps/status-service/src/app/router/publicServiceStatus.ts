import { Router } from 'express';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { environment } from '../../environments/environment';
import { TenantService } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  serviceStatusRepository: ServiceStatusRepository;
}

export function mapApplication(entity: ServiceStatusApplicationEntity): unknown {
  return {
    id: entity._id,
    name: entity.name,
    description: entity.description,
    status: entity.status,
    lastUpdated: entity.statusTimestamp ? new Date(entity.statusTimestamp) : null,
  };
}

export function createPublicServiceStatusRouter({
  logger,
  tenantService,
  serviceStatusRepository,
}: ServiceStatusRouterProps): Router {
  const router = Router();

  // Get the public service for the tenant
  router.get('/applications/:name', async (req, res, next) => {
    logger.info(req.method, req.url);
    const { name } = req.params;
    const searchName = (name || environment.PLATFORM_TENANT_REALM).toLowerCase();

    try {
      const tenants = await tenantService.getTenants();
      const tenantId = tenants.find((tenant) => tenant.name.toLowerCase() === searchName)?.id;
      if (!tenantId) {
        throw new NotFoundError('tenant', name);
      }

      const applications = await serviceStatusRepository.find({
        tenantId: tenantId.toString(),
      });

      res.json(applications.map(mapApplication));
    } catch (err) {
      const errMessage = `Error getting applications: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  return router;
}
