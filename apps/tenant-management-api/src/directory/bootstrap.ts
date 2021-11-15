import * as fs from 'fs';
import * as util from 'util';
import { Logger } from 'winston';
import { Directory } from './types/directory';
import { DirectoryRepository } from './repository';

export const bootstrapDirectory = async (logger: Logger, file: string, directoryRepository: DirectoryRepository): Promise<void> => {
  logger.debug(`Bootstrapping directory data from: ${file}...`);
  const fileData = await util.promisify(fs.readFile)(file, { encoding: 'utf-8' });
  const directory: Directory = JSON.parse(fileData);

  logger.debug(`Parsed directory bootstrap file '${file}' and importing...`);

  await directoryRepository.update(directory);
  logger.info(`Bootstrapped directory data from: ${file}.`);
};
