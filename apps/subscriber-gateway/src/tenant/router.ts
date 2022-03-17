import { adspId, TenantService } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';

export function getTenant(tenantService: TenantService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      const tenant = await tenantService.getTenant(
        adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenantId as string}`
      );
      if (!tenant) {
        throw new NotFoundError('Tenant', tenantId);
      }
      res.send(tenant);
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  tenantService: TenantService;
}

export const createTenantRouter = ({ tenantService }: RouterProps): Router => {
  const router = Router();

  router.get('/tenant/:tenantId', getTenant(tenantService));

  return router;
};
