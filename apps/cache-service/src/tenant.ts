import { AdspId, AdspIdFormatError, startBenchmark, TenantService } from '@abgov/adsp-service-sdk';
import { RequestHandler } from 'express';

export const createAnonymousTenantHandler =
  (service: TenantService): RequestHandler =>
  async (req, _res, next) => {
    const end = startBenchmark(req, 'get-tenant-time');
    const { tenantId: tenantIdValue } = req.query;
    try {
      if (!req.user && tenantIdValue !== undefined && typeof tenantIdValue !== 'string') {
        throw new AdspIdFormatError('tenantId must be a single tenant URN.');
      }
      // When there is no user context (anonymous), then allow selection of tenant via the tenantId query param.
      const tenantId = !req.user && tenantIdValue ? AdspId.parse(tenantIdValue as string) : null;
      if (tenantId) {
        req.tenant = await service.getTenant(tenantId);
      }
    } catch (err) {
      next(err);
      return;
    }
    end();
    next();
  };
