import type { Logger } from 'winston';
import type { ServiceDirectory } from '../directory';
import { AdspId } from '../utils';
import type { Configuration } from './configuration';
import { ConfigurationService, ConfigurationServiceImpl } from './configurationService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      getConfiguration?: <C, O = undefined>(tenantId?: AdspId) => Promise<Configuration<O, C>>;
    }
  }
}

export { createConfigurationHandler } from './configurationHandler';
export type { ConfigurationService } from './configurationService';

interface ConfigurationServiceOptions {
  directory: ServiceDirectory;
  logger: Logger;
}

export const createConfigurationService = ({
  directory,
  logger,
}: ConfigurationServiceOptions): ConfigurationService => {
  return new ConfigurationServiceImpl(logger, directory);
};
