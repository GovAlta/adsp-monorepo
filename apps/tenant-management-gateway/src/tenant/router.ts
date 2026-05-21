import { Router } from 'express';
import { Logger } from 'winston';

export interface TenantManagementRouterProps {
  logger: Logger;
}

export function createTenantManagementRouter({ logger }: TenantManagementRouterProps): Router {
  const router = Router();

  router.get('/test', (_req, res) => {
    logger.debug('GET /api/tenant/v1/test');
    res.status(200).json({ status: 'healthy' });
  });

  return router;
}
