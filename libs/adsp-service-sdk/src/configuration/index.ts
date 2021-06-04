import type { Logger } from 'winston';
import type { ServiceDirectory } from '../directory';
import { AdspId } from '../utils';
import type { Configuration, ConfigurationConverter } from './configuration';
import { ConfigurationService, ConfigurationServiceImpl } from './configurationService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      getConfiguration?: <C, O = void>(tenantId?: AdspId) => Promise<Configuration<C, O>>;
    }
  }
}

export type { ConfigurationConverter } from './configuration';
export { createConfigurationHandler } from './configurationHandler';
export type { ConfigurationService } from './configurationService';

interface ConfigurationServiceOptions {
  directory: ServiceDirectory;
  logger: Logger;
  converter: ConfigurationConverter;
}

export const createConfigurationService = ({
  directory,
  logger,
  converter,
}: ConfigurationServiceOptions): ConfigurationService => {
  return new ConfigurationServiceImpl(logger, directory, converter);
};
