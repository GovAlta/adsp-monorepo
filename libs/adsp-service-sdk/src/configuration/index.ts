import type { Logger } from 'winston';
import type { TokenProvider } from '../access';
import type { ServiceDirectory } from '../directory';
import { ConfigurationService, ConfigurationServiceImpl } from './configurationService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      getConfiguration?: <C>() => C
    }
  }
}

export { createConfigurationHandler } from './configurationHandler';
export type { ConfigurationService } from './configurationService';

interface ConfigurationServiceOptions {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export const createConfigurationService = ({
  directory,
  tokenProvider,
  logger
}: ConfigurationServiceOptions): ConfigurationService => {
  return new ConfigurationServiceImpl(logger, directory, tokenProvider);
}
