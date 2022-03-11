import type { Logger } from 'winston';
import type { ServiceDirectory } from '../directory';
import { AdspId } from '../utils';
import type { CombineConfiguration, ConfigurationConverter } from './configuration';
import { ConfigurationServiceImpl } from './configurationService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      getConfiguration?: <C, R = [C, C]>(tenantId?: AdspId) => Promise<R>;
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
  combine: CombineConfiguration;
}

export const createConfigurationService = ({
  directory,
  logger,
  converter,
  combine,
}: ConfigurationServiceOptions): ConfigurationServiceImpl => {
  return new ConfigurationServiceImpl(logger, directory, converter, combine);
};
