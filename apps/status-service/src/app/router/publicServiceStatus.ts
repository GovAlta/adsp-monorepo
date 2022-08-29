import { Router, RequestHandler } from 'express';
import { Logger } from 'winston';
import { ApplicationEntity, StatusServiceConfiguration } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { environment } from '../../environments/environment';
import { TenantService } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  serviceStatusRepository: ServiceStatusRepository;
}

export const getApplicationsByName =
  (logger: Logger, tenantService: TenantService, serviceStatusRepository: ServiceStatusRepository): RequestHandler =>
  async (req, res, next) => {
    logger.info(req.method, req.url);
    const { name } = req.params;
    const searchName = (name || environment.PLATFORM_TENANT_REALM).toLowerCase();

    try {
      const tenants = await tenantService.getTenants();
      const tenantId = tenants.find((tenant) => tenant.name.toLowerCase() === searchName)?.id;

      if (!tenantId) {
        throw new NotFoundError('tenant', name);
      }

      const [tenantConfig] = await req.getConfiguration<StatusServiceConfiguration>(tenantId);

      const applications = await serviceStatusRepository.find({
        tenantId: tenantId.toString(),
      });
      res.json(
        applications.map((a) => {
          const config = tenantConfig ? (tenantConfig[a._id] as ApplicationEntity) : null;
          return {
            id: a._id,
            name: config?.name || name,
            description: config?.description || '',
            status: a?.status,
            lastUpdated: a?.statusTimestamp ? new Date(a.statusTimestamp) : null,
          };
        })
      );
    } catch (err) {
      const errMessage = `Error getting applications: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  };

export function createPublicServiceStatusRouter({
  logger,
  tenantService,
  serviceStatusRepository,
}: ServiceStatusRouterProps): Router {
  const router = Router();

  // Get the public service for the tenant
  router.get('/applications/:name', getApplicationsByName(logger, tenantService, serviceStatusRepository));

  return router;
}
