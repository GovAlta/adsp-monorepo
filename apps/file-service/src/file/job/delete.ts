import { AdspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { File } from '../types';

interface DeleteJobProps {
  logger: Logger;
  fileRepository: FileRepository;
}

export const createDeleteJob =
  ({ logger, fileRepository }: DeleteJobProps) =>
  async (tenantId: AdspId, { id, filename }: File, done: (err?: Error) => void): Promise<void> => {
    try {
      logger.debug(`Deleting file ${filename} (ID: ${id})...`, {
        context: 'FileDeleteJob',
        tenant: tenantId?.toString(),
      });
      const result = await fileRepository.get(id);
      if (result) {
        const deleted = await result.delete();
        if (deleted) {
          logger.debug(`Deleted file ${filename} (ID: ${id}).`, {
            context: 'FileDeleteJob',
            tenant: tenantId?.toString(),
          });
        }
      } else {
        logger.warn(`Could not find file ${filename} (ID: ${id}) for delete.`, {
          context: 'FileDeleteJob',
          tenant: tenantId?.toString(),
        });
      }

      done();
    } catch (err) {
      logger.error(`Error encountered deleting file ${filename} (ID: ${id}): ${err}`, {
        context: 'FileDeleteJob',
        tenant: tenantId?.toString(),
      });
      done(err);
    }
  };
