import { FileRepository } from '../repository';
import { Logger } from 'winston';

interface DeleteJobProps {
  logger: Logger;
  fileRepository: FileRepository;
}
// eslint-disable-next-line
export const createDeleteJob =
  ({ logger, fileRepository }: DeleteJobProps) =>
  async (): Promise<number> => {
    logger.debug('Starting file delete job...');

    let numberDeleted = 0;
    let after = null;
    do {
      const { results, page } = await fileRepository.find(10, after, { deleted: true });
      after = page.next;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        try {
          if (await result.delete()) {
            numberDeleted++;
          }
        } catch (err) {
          logger.error(`Error encountered deleting file ${result.filename} (ID: ${result.id}): ${err}`);
        }
      }
      logger.debug(`Deleted page and proceeding to next: ${after || '(none)'}...`);
    } while (after);

    logger.info(`Completed file delete job and deleted ${numberDeleted} files.`);
    return numberDeleted;
  };
