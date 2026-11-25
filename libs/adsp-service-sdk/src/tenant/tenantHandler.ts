import type { RequestHandler } from 'express';
import { trace } from '@opentelemetry/api';
import { startBenchmark } from '../metrics';
import { getRequestedTenant } from './requestedTenant';
import type { Tenant, TenantService } from './tenantService';

export const createTenantHandler =
  (service: TenantService): RequestHandler =>
  async (req, _res, next) => {
    const end = startBenchmark(req, 'get-tenant-time');
    // Resolution failures are the measurements most worth having, so end the benchmark on every
    // path rather than returning early past it.
    let failure: unknown;
    try {
      const { tenantId: tenantIdValue } = req.query;
      let tenant: Tenant;
      if (req.user?.isCore && tenantIdValue) {
        tenant = await getRequestedTenant(service, tenantIdValue);
      } else if (req.user?.tenantId) {
        tenant = await service.getTenant(req.user.tenantId);
      }
      if (tenant) {
        req.tenant = tenant;
        trace.getActiveSpan()?.setAttribute('adsp.tenant.id', tenant.id.toString());
        trace.getActiveSpan()?.setAttribute('adsp.tenant.name', tenant.name);
      }
    } catch (err) {
      failure = err;
    } finally {
      end();
    }

    next(failure);
  };
