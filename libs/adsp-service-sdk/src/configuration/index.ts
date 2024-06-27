import type { Logger } from 'winston';
import { TokenProvider } from '../access';
import type { ServiceDirectory } from '../directory';
import { AdspId } from '../utils';
import type { CombineConfiguration, ConfigurationConverter } from './configuration';
import { ConfigurationServiceImpl } from './configurationService';
import { handleConfigurationUpdates } from './configurationUpdateHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Retrieves latest configuration revision for service initialized with SDK.
       * Configuration is retrieved from {service namespace}:{service}.
       *
       * @memberof Request
       */
      getConfiguration?: <C, R = [C, C]>(tenantId?: AdspId) => Promise<R>;

      /**
       * Retrieves active configuration revision, with fallback to latest, for service initialized with SDK.
       * Note that configuration is retrieved from {service}:{name} if useNamespace is true in SDK initialization.
       *
       * @memberof Request
       */
      getServiceConfiguration?: <C, R = [C, C]>(name?: string, tenantId?: AdspId) => Promise<R>;
    }
  }
}

export type { ConfigurationConverter, CombineConfiguration } from './configuration';
export { createConfigurationHandler } from './configurationHandler';
export type { ConfigurationService } from './configurationService';

interface ConfigurationServiceOptions {
  serviceId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  useNamespace: boolean;
  converter: ConfigurationConverter;
  combine: CombineConfiguration;
  enableConfigurationInvalidation?: boolean;
  useLongConfigurationCacheTTL?: boolean;
}

export const createConfigurationService = ({
  serviceId,
  logger,
  directory,
  tokenProvider,
  useNamespace,
  converter,
  combine,
  enableConfigurationInvalidation,
  useLongConfigurationCacheTTL,
}: ConfigurationServiceOptions): ConfigurationServiceImpl => {
  const service = new ConfigurationServiceImpl(
    serviceId,
    logger,
    directory,
    tokenProvider,
    useNamespace,
    converter,
    combine,
    useLongConfigurationCacheTTL ? 36000 : 900
  );

  if (enableConfigurationInvalidation) {
    handleConfigurationUpdates(logger, directory, tokenProvider, service);
  }

  return service;
};
