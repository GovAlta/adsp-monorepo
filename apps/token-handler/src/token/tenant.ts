import { AdspId, TenantService } from '@abgov/adsp-service-sdk';
import { RequestHandler } from 'express';

const TENANT_HEADER = 'x-adsp-tenant';
export function createTenantHandler(tenantService: TenantService): RequestHandler {
  return async function (req, _res, next) {
    try {
      const tenantIdValue = req.headers[TENANT_HEADER];
      if (tenantIdValue) {
        const tenantId = AdspId.parse(tenantIdValue as string);
        const tenant = await tenantService.getTenant(tenantId);
        req.tenant = tenant;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
