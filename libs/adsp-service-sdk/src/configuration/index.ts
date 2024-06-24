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
      getConfiguration?: <C, R = [C, C]>(tenantId?: AdspId) => Promise<R>;
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
  useActive: boolean;
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
  useActive,
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
    useActive,
    converter,
    combine,
    useLongConfigurationCacheTTL ? 36000 : 900
  );

  if (enableConfigurationInvalidation) {
    handleConfigurationUpdates(logger, directory, tokenProvider, service);
  }

  return service;
};
