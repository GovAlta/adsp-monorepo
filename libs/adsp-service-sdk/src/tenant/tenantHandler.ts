import type { RequestHandler } from 'express';
import { AdspId } from '../utils';
import { TenantService } from './tenantService';

export const createTenantHandler =
  (service: TenantService): RequestHandler =>
  async (req, _res, next) => {
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
    next();
  };
