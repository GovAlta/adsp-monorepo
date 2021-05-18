import type { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory, ServiceDirectoryImpl } from './serviceDirectory';

export type { ServiceDirectory } from './serviceDirectory';

interface DirectoryOptions {
  directoryUrl: URL;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export function createDirectory({ directoryUrl, tokenProvider, logger }: DirectoryOptions): ServiceDirectory {
  return new ServiceDirectoryImpl(logger, directoryUrl, tokenProvider);
}
