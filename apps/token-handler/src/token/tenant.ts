import { AdspId, Tenant, TenantService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { RequestHandler } from 'express';

const TENANT_HEADER = 'x-adsp-tenant';
export function createTenantHandler(tenantService: TenantService): RequestHandler {
  return async function (req, _res, next) {
    try {
      const tenantIdValue = req.headers[TENANT_HEADER] as string;
      if (!tenantIdValue) {
        throw new InvalidOperationError(`${TENANT_HEADER} header with tenant identity is required.`);
      }

      let tenant: Tenant = null;
      try {
        if (AdspId.isAdspId(tenantIdValue)) {
          const tenantId = AdspId.parse(tenantIdValue);
          tenant = await tenantService.getTenant(tenantId);
        } else {
          tenant = await tenantService.getTenantByName(tenantIdValue.replace(/-/g, ' '));
        }
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
