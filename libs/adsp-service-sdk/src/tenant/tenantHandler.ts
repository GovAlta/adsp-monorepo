import type { RequestHandler } from 'express';
import { benchmark } from '../metrics';
import { AdspId } from '../utils';
import { TenantService } from './tenantService';

export const createTenantHandler =
  (service: TenantService): RequestHandler =>
  async (req, _res, next) => {
    benchmark(req, 'get-tenant-time');
    const { tenantId: tenantIdValue } = req.query;
    const tenantId = req.user?.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : req.user?.tenantId;
    if (tenantId) {
      try {
        const tenant = await service.getTenant(tenantId);
        req.tenant = tenant;
      } catch (err) {
        next(err);
        return;
      }
    }
    benchmark(req, 'get-tenant-time');
    next();
  };
