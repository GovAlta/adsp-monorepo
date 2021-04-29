import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError, User } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { ServiceStatusRepository } from '../repository/serviceStatus';

export interface ServiceStatusRouterProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
}

/**
 * REQUIREMENTS
 * - get health monitor
 * - enable health monitoring
 * - disable health monitoring
 *
 * Later
 * - api urls have to be provided from applications, since user will not know them
 *
 */

export function createServiceStatusRouter({ logger, serviceStatusRepository }: ServiceStatusRouterProps) {
  const router = Router();

  // Get the service for the tenant
  // TODO: determine if this is the best way to pass the tenant id
  // TODO: need to validate the that the user has tenant access
  router.get('/tenants/:tenantId/health', assertAuthenticatedHandler, async (req, res) => {
    const { tenantId } = req.params;
    logger.info(`Current user: ${req.user}`);
    const serviceStatus = await serviceStatusRepository.getByTenantId(tenantId);
    res.json(serviceStatus);
  });

  // Enable the service
  router.post('/tenants/:tenantId/health', assertAuthenticatedHandler, (req, res) => {
    const { tenantId } = req.params;

    // TODO: get it
  });

  // Delete the service
  router.delete('/tenants/:tenantId/health', assertAuthenticatedHandler, (req, res) => {
    const { tenantId } = req.params;

    // TODO: get it
  });

  return router;
}
