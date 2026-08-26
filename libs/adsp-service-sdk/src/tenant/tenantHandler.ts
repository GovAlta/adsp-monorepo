import type { RequestHandler } from 'express';
import { trace } from '@opentelemetry/api';
import { startBenchmark } from '../metrics';
import { AdspId } from '../utils';
import { TenantService } from './tenantService';

export const createTenantHandler =
  (service: TenantService): RequestHandler =>
  async (req, _res, next) => {
    const end = startBenchmark(req, 'get-tenant-time');
    // Resolution failures are the measurements most worth having, so end the benchmark on every
    // path rather than returning early past it.
    let failure: unknown;
    try {
      const { tenantId: tenantIdValue } = req.query;
      const tenantId = req.user?.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : req.user?.tenantId;
      if (tenantId) {
        const tenant = await service.getTenant(tenantId);
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
