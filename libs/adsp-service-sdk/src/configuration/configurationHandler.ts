import type { RequestHandler } from 'express';
import { TokenProvider } from '../access';
import { startBenchmark } from '../metrics';
import { AdspId } from '../utils';
import type { ConfigurationService } from './configurationService';

export const createConfigurationHandler =
  (tokenProvider: TokenProvider, service: ConfigurationService, serviceId: AdspId): RequestHandler =>
  async (req, _res, next) => {
    const contextTenantId = req.tenant?.id || req.user?.tenantId;

    req.getConfiguration = async <C, R = [C, C]>(tenantId?: AdspId) => {
      const end = startBenchmark(req, 'get-configuration-time');
      const token = await tokenProvider.getAccessToken();
      const config = await service.getConfiguration<C, R>(serviceId, token, tenantId || contextTenantId);
      end();
      return config;
    };

    req.getServiceConfiguration = async <C, R = [C, C, number?]>(name?: string, tenantId?: AdspId) => {
      const end = startBenchmark(req, 'get-configuration-time');
      const config = await service.getServiceConfiguration<C, R>(name, tenantId || contextTenantId);
      end();
      return config;
    };

    next();
  };

export const createTenantConfigurationHandler =
  (tokenProvider: TokenProvider, service: ConfigurationService, serviceId: AdspId, tenantId: AdspId): RequestHandler =>
  async (req, _res, next) => {
    req.getConfiguration = async <C, R = [C, C]>() => {
      const end = startBenchmark(req, 'get-configuration-time');
      const token = await tokenProvider.getAccessToken();
      const config = await service.getConfiguration<C, R>(serviceId, token, tenantId);
      end();
      return config;
    };

    req.getServiceConfiguration = async <C, R = [C, C, number?]>(name?: string) => {
      const end = startBenchmark(req, 'get-configuration-time');
      const config = await service.getServiceConfiguration<C, R>(name, tenantId);
      end();
      return config;
    };

    next();
  };
