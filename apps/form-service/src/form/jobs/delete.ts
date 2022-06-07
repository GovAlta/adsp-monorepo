import { EventService } from '@abgov/adsp-service-sdk';
import { DateTime, Duration } from 'luxon';
import { Logger } from 'winston';
import { FileService } from '../../file';
import { NotificationService } from '../../notification';
import { formDeleted } from '../events';
import { FormRepository } from '../repository';
import { FormStatus } from '../types';
import { jobUser } from './user';

interface DeleteJobProps {
  logger: Logger;
  repository: FormRepository;
  eventService: EventService;
  fileService: FileService;
  notificationService: NotificationService;
}

export const MAX_LOCKED_AGE = Duration.fromISO('P15D');
export function createDeleteJob({
  logger,
  repository,
  eventService,
  fileService,
  notificationService,
}: DeleteJobProps) {
  return async (): Promise<void> => {
    try {
      logger.debug('Starting form delete job...');

      let after = null;
      let numberDeleted = 0;
      do {
        const { results, page } = await repository.find(20, after, {
          statusEquals: FormStatus.Locked,
          lockedBefore: DateTime.now().minus(MAX_LOCKED_AGE).toJSDate(),
        });

        for (const result of results) {
          try {
            const deleted = await result.delete(jobUser, fileService, notificationService);
            if (deleted) {
              numberDeleted++;
              eventService.send(formDeleted(jobUser, result));
            }
          } catch (err) {
            // Log and continue with other forms if there's an error on form delete.
            logger.error(`Error deleting form with ID: ${result.id}. ${err}`);
          }
        }

        after = page.next;
      } while (after);

      logger.info(`Completed form delete job and deleted ${numberDeleted} forms.`);
    } catch (err) {
      logger.error(`Error encountered in form deleting job. ${err}`);
    }
  };
}
