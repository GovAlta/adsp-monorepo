import * as fs from 'fs';
import * as util from 'util';
import { Logger } from 'winston';
import DirectoryModel from './models/directory';
import { Directory } from './types/directory';

export const bootstrapDirectory = async (logger: Logger, file: string): Promise<void> => {
  logger.debug(`Bootstrapping directory data from: ${file}...`);
  const fileData = await util.promisify(fs.readFile)(file, { encoding: 'utf-8' });
  const directory: Directory = JSON.parse(fileData);

  logger.debug(`Parsed directory bootstrap file '${file}' and importing...`);
  await new Promise<void>((resolve, reject) => {
    DirectoryModel.findOneAndUpdate({ name: directory.name }, directory, { upsert: true }, (err) =>
      err ? reject(err) : resolve()
    );
  });

  logger.info(`Bootstrapped directory data from: ${file}.`);
};
