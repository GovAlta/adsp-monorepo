import type { RequestHandler } from 'express';
import { AdspId, adspId } from '../utils';
import { TenantService } from './tenantService';

export const createTenantHandler =
  (tenantApiId: AdspId, service: TenantService): RequestHandler =>
  async (req, _res, next) => {
    const { tenant } = req?.query;
    const tenantId = req.user?.isCore && tenant ? adspId`${tenantApiId}:/tenants/${tenant}` : req.user?.tenantId;
    if (tenantId) {
      try {
        const tenant = await service.getTenant(tenantId);
        req.tenant = tenant;
      } catch (err) {
        next(err);
        return;
      }
    }
    next();
  };
