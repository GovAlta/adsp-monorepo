import * as fs from 'fs';
import * as util from 'util';
import { Logger } from 'winston';
import { Directory } from './types/directory';
import { DirectoryRepository } from './repository';
import { MongoDirectoryRepository } from './mongo/directory';

export const bootstrapDirectory = async (logger: Logger, file: string): Promise<void> => {
  logger.debug(`Bootstrapping directory data from: ${file}...`);
  const fileData = await util.promisify(fs.readFile)(file, { encoding: 'utf-8' });
  const directory: Directory = JSON.parse(fileData);

  logger.debug(`Parsed directory bootstrap file '${file}' and importing...`);

  const directoryRepository: DirectoryRepository = new MongoDirectoryRepository();
  await directoryRepository.update(directory);
  logger.info(`Bootstrapped directory data from: ${file}.`);
};
