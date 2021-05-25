import type { RequestHandler } from 'express';
import { ConfigurationService } from './configurationService';

export const createConfigurationHandler = (service: ConfigurationService): RequestHandler => async (
  req,
  _res,
  next
) => {
  const tenant = req.user?.tenantId;
  if (tenant) {
    try {
      const configuration = await service.getConfiguration(tenant, req.user.token.bearer);
      req.getConfiguration = <C>() => configuration as C;
    } catch (err) {
      next(err);
      return;
    }
  }
  next();
};
