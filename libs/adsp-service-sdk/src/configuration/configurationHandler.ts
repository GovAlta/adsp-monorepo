import type { RequestHandler } from 'express';
import { AdspId } from '../utils';
import type { ConfigurationService } from './configurationService';

export const createConfigurationHandler = (service: ConfigurationService, serviceId: AdspId): RequestHandler => async (
  req,
  _res,
  next
) => {
  const contextTenantId = req.user?.tenantId;

  req['getConfiguration'] = <C, O = undefined>(tenantId?: AdspId) =>
    service.getConfiguration<C, O>(serviceId, req.user.token.bearer, tenantId || contextTenantId);

  next();
};
