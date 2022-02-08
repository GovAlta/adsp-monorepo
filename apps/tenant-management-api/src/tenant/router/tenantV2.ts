import { adspId, Tenant } from '@abgov/adsp-service-sdk';
import { Router } from 'express';
import { requirePlatformService } from '../../middleware/authentication';
import * as tenantService from '../services/tenant';
import { logger } from '../../middleware/logger';
import { TenantRepository } from '../repository';
import { TenantCriteria } from '../types';

interface TenantRouterProps {
  tenantRepository: TenantRepository;
}

function mapTenant(tenant: Tenant) {
  return {
    id: `${tenant.id}`,
    realm: tenant.realm,
    name: tenant.name,
  };
}

export const createTenantV2Router = ({ tenantRepository }: TenantRouterProps): Router => {
  const tenantV2Router: Router = Router();

  tenantV2Router.get('/tenants', requirePlatformService, async (req, res, next) => {
    try {
      const { name, realm, adminEmail } = req.query;
      const criteria: TenantCriteria = {};
      if (name) {
        criteria.nameEquals = `${name}`;
      }

      if (realm) {
        criteria.realmEquals = `${realm}`;
      }

      if (adminEmail) {
        criteria.adminEmailEquals = `${adminEmail}`;
      }

      // FIXME: accessing a non-injected dependency makes this hard to test
      const tenants = await tenantService.getTenants(tenantRepository, criteria);

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
