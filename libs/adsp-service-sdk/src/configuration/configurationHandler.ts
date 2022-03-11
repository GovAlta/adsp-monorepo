import type { RequestHandler } from 'express';
import { TokenProvider } from '../access';
import { AdspId } from '../utils';
import type { ConfigurationService } from './configurationService';

export const createConfigurationHandler =
  (tokenProvider: TokenProvider, service: ConfigurationService, serviceId: AdspId): RequestHandler =>
  async (req, _res, next) => {
    const contextTenantId = req.tenant?.id || req.user?.tenantId;

    req['getConfiguration'] = async <C, R = [C, C]>(tenantId?: AdspId) => {
      const token = await tokenProvider.getAccessToken();
      const config = await service.getConfiguration<C, R>(serviceId, token, tenantId || contextTenantId);
      return config;
    };

    next();
  };
