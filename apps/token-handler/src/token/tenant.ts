import { AdspId, Tenant, TenantService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { RequestHandler } from 'express';

const TENANT_HEADER = 'x-adsp-tenant';
export function createTenantHandler(tenantService: TenantService): RequestHandler {
  return async function (req, _res, next) {
    try {
      const tenantIdValue = req.headers[TENANT_HEADER];
      if (!tenantIdValue) {
        throw new InvalidOperationError(`${TENANT_HEADER} header with tenant ID is required.`);
      }

      let tenant: Tenant = null;
      try {
        const tenantId = AdspId.parse(tenantIdValue as string);
        tenant = await tenantService.getTenant(tenantId);
      } catch (err) {
        // For format issue, just return as not found.
      }

      if (!tenant) {
        throw new NotFoundError('tenant', tenantIdValue?.toString());
      }

      req.tenant = tenant;

      next();
    } catch (err) {
      next(err);
    }
  };
}
