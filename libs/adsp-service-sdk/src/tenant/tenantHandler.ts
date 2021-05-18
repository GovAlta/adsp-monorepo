import type { RequestHandler } from 'express';
import { TenantService } from './tenantService';

export const createTenantHandler = (service: TenantService): RequestHandler => async (req, _res, next) => {
  const tenantId = req.user?.tenantId;
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
