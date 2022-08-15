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
    }
  }
}

export type { ConfigurationConverter, CombineConfiguration } from './configuration';
export { createConfigurationHandler } from './configurationHandler';
export type { ConfigurationService } from './configurationService';

interface ConfigurationServiceOptions {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  converter: ConfigurationConverter;
  combine: CombineConfiguration;
  enableConfigurationInvalidation?: boolean;
}

export const createConfigurationService = ({
  logger,
  directory,
  tokenProvider,
  converter,
  combine,
  enableConfigurationInvalidation,
}: ConfigurationServiceOptions): ConfigurationServiceImpl => {
  const service = new ConfigurationServiceImpl(logger, directory, converter, combine);
  if (enableConfigurationInvalidation) {
    handleConfigurationUpdates(logger, directory, tokenProvider, service);
  }

  return service;
};
