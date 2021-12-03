import { Router } from 'express';
import { TenantRepository } from '../repository';
import { InvalidValueError } from '@core-services/core-common';

interface TenantRouterProps {
  tenantRepository: TenantRepository;
}

export const createTenantPublicRouter = ({ tenantRepository }: TenantRouterProps): Router => {
  const tenantPublicRouter = Router();

  async function getKeycloakIdByTenantName(req, res, next) {
    try {
      const tenantName = req.query?.tenantName
      if (!tenantName) {
        throw new InvalidValueError('Fetching Keycloak realm Id', 'Missing query parameter tenantName');
      }
      const tenant = await tenantRepository.findByName(tenantName)
      res.json({
        realm: tenant.realm
      })
    } catch (error) {
      next(error);
    }
  }

  tenantPublicRouter.get('/realm/id', getKeycloakIdByTenantName);

  return tenantPublicRouter;
}