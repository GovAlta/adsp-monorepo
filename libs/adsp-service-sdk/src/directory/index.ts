import type { Logger } from 'winston';
import { ServiceDirectory, ServiceDirectoryImpl } from './serviceDirectory';

export type { ServiceDirectory } from './serviceDirectory';

interface DirectoryOptions {
  directoryUrl: URL;
  logger: Logger;
}

export function createDirectory({ directoryUrl, logger }: DirectoryOptions): ServiceDirectory {
  return new ServiceDirectoryImpl(logger, directoryUrl);
}
