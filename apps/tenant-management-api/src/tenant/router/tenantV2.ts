import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { RequestHandler, Router } from 'express';
import { logger } from '../../middleware/logger';
import { Tenant } from '../models';
import { TenantRepository } from '../repository';
import { TenantCriteria } from '../types';

interface TenantRouterProps {
  tenantRepository: TenantRepository;
}

function mapTenant(tenant: Tenant) {
  return {
    id: `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`,
    realm: tenant.realm,
    name: tenant.name,
    adminEmail: tenant.adminEmail,
  };
}

export function getTenants(repository: TenantRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
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
      const tenants = (await repository.find(criteria)).filter(
        (tenant) =>
          user.isCore || user.tenantId.toString() === `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`
      );

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
  };
}

export function getTenant(repository: TenantRepository): RequestHandler {
  return async (req, res, next) => {
    const user = req.user;
    const { id } = req.params;

    try {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/${id}`;
      if (!user.isCore && user.tenantId.toString() !== tenantId.toString()) {
        throw new UnauthorizedUserError('get tenant', user);
      }

      const tenant = await repository.get(id);
      res.json(mapTenant(tenant));
    } catch (err) {
      logger.error(`Failed to get tenant with error: ${err.message}`);
      next(err);
    }
  };
}

export const createTenantV2Router = ({ tenantRepository }: TenantRouterProps): Router => {
  const tenantV2Router: Router = Router();

  tenantV2Router.get('/tenants', getTenants(tenantRepository));
  tenantV2Router.get('/tenants/:id', getTenant(tenantRepository));

  return tenantV2Router;
};
