import type { RequestHandler } from 'express';
import { TokenProvider } from '../access';
import { benchmark } from '../metrics';
import { AdspId } from '../utils';
import type { ConfigurationService } from './configurationService';

export const createConfigurationHandler =
  (tokenProvider: TokenProvider, service: ConfigurationService, serviceId: AdspId): RequestHandler =>
  async (req, _res, next) => {
    const contextTenantId = req.tenant?.id || req.user?.tenantId;

    req['getConfiguration'] = async <C, R = [C, C]>(tenantId?: AdspId) => {
      benchmark(req, 'get-configuration-time');
      const token = await tokenProvider.getAccessToken();
      const config = await service.getConfiguration<C, R>(serviceId, token, tenantId || contextTenantId);
      benchmark(req, 'get-configuration-time');
      return config;
    };

    next();
  };

export const createTenantConfigurationHandler =
  (tokenProvider: TokenProvider, service: ConfigurationService, serviceId: AdspId, tenantId: AdspId): RequestHandler =>
  async (req, _res, next) => {
    req['getConfiguration'] = async <C, R = [C, C]>() => {
      benchmark(req, 'get-configuration-time');
      const token = await tokenProvider.getAccessToken();
      const config = await service.getConfiguration<C, R>(serviceId, token, tenantId);
      benchmark(req, 'get-configuration-time');
      return config;
    };

    next();
  };
