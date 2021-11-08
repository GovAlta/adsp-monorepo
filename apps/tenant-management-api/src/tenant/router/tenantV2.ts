import { adspId } from '@abgov/adsp-service-sdk';
import { Router } from 'express';
import { requirePlatformService } from '../../middleware/authentication';
import * as tenantService from '../services/tenant';
import { logger } from '../../middleware/logger';
import { TenantEntity } from '../models';
import { TenantRepository } from '..';

const mapTenant = (entity: TenantEntity) => ({
  id: `${entity.id}`,
  realm: entity.realm,
  adminEmail: entity.adminEmail,
  name: entity.name,
});

interface TenantRouterProps {
  tenantRepository: TenantRepository;
}

export const createTenantV2Router = ({ tenantRepository }: TenantRouterProps): Router => {
  const tenantV2Router: Router = Router();

  tenantV2Router.get('/tenants', requirePlatformService, async (_req, res, next) => {
    try {
      // FIXME: accessing a non-injected dependency makes this hard to test
      const tenants = await tenantService.getTenants(tenantRepository);

      res.json({
        results: tenants.map(mapTenant),
        page: {
          size: tenants.length,
        },
      });
    } catch (err) {
      logger.error(`Failed to get tenants with error: ${err.message}`);
      next(err);
    }
  });

  tenantV2Router.get('/tenants/:id', requirePlatformService, async (req, res, next) => {
    const { id } = req.params;

    try {
      const tenant = await tenantService.getTenant(tenantRepository, adspId`urn:ads:platform:tenant-service:v2:${id}`);
      res.json(mapTenant(tenant));
    } catch (err) {
      logger.error(`Failed to get tenant with error: ${err.message}`);
      next(err);
    }
  });

  return tenantV2Router;
};
