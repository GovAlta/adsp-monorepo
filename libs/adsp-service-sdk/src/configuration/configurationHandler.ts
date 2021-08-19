import type { RequestHandler } from 'express';
import { TokenProvider } from '../access';
import { AdspId } from '../utils';
import type { ConfigurationService } from './configurationService';

export const createConfigurationHandler = (
  tokenProvider: TokenProvider,
  service: ConfigurationService,
  serviceId: AdspId
): RequestHandler => async (req, _res, next) => {
  const contextTenantId = req.user?.tenantId;

  req['getConfiguration'] = async <C, O = undefined>(tenantId?: AdspId) => {
    const token = await tokenProvider.getAccessToken();
    const config = await service.getConfiguration<C, O>(serviceId, token, tenantId || contextTenantId);
    return config;
  };

  next();
};
