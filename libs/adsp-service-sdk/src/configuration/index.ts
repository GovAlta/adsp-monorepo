import type { Logger } from 'winston';
import type { ServiceDirectory } from '../directory';
import { AdspId } from '../utils';
import { ConfigurationService, ConfigurationServiceImpl } from './configurationService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      getConfiguration?: <C>() => C;
    }
  }
}

export { createConfigurationHandler } from './configurationHandler';
export type { ConfigurationService } from './configurationService';

interface ConfigurationServiceOptions {
  directory: ServiceDirectory;
  logger: Logger;
  serviceId: AdspId;
}

export const createConfigurationService = ({
  directory,
  logger,
  serviceId,
}: ConfigurationServiceOptions): ConfigurationService => {
  return new ConfigurationServiceImpl(logger, directory, serviceId);
};
