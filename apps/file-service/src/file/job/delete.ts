import { FileRepository } from '../repository';
import { Logger } from 'winston';

interface DeleteJobProps {
  logger: Logger;
  rootStoragePath: string;
  fileRepository: FileRepository;
}

export const createDeleteJob = ({ logger, rootStoragePath, fileRepository }: DeleteJobProps) => () => {
  logger.debug('Starting file delete job...');

  return fileRepository
    .find(20, null, { deleted: true })
    .then((results) =>
      Promise.all(
        results.results.map((result) =>
          result.delete(rootStoragePath).catch((err) => {
            logger.warn(
              `Error encountered deleting file ` + `${result.getFilePath(rootStoragePath)} (ID: ${result.id}): ${err}`
            );

            return false;
          })
        )
      )
    )
    .then((deleted) => {
      const numberDeleted = deleted.filter((deleted) => !!deleted).length;
      logger.info(`Completed file delete job and deleted ${numberDeleted} files.`);
      return numberDeleted;
    });
};
