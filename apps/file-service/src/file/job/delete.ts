import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { File } from '../types';

interface DeleteJobProps {
  logger: Logger;
  fileRepository: FileRepository;
}

export const createDeleteJob =
  ({ logger, fileRepository }: DeleteJobProps) =>
  async ({ id, filename }: File, done: (err?: Error) => void): Promise<void> => {
    try {
      logger.debug(`Deleting file ${filename} (ID: ${id})...`);
      const result = await fileRepository.get(id);
      const deleted = await result.delete();
      if (deleted) {
        logger.debug(`Deleted file ${filename} (ID: ${id}).`);
      }

      done();
    } catch (err) {
      logger.error(`Error encountered deleting file ${filename} (ID: ${id}): ${err}`);
      done(err);
    }
  };
