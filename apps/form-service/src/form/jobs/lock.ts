import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { DateTime, Duration } from 'luxon';
import { Logger } from 'winston';
import { formLocked } from '../events';
import { FormRepository } from '../repository';
import { FormStatus } from '../types';
import { MAX_LOCKED_AGE } from './delete';
import { jobUser } from './user';

interface LockJobProps {
  apiId: AdspId;
  logger: Logger;
  repository: FormRepository;
  eventService: EventService;
}

const MAX_STALE_AGE = Duration.fromISO('P15D');
export function createLockJob({ apiId, logger, repository, eventService }: LockJobProps) {
  return async (): Promise<void> => {
    try {
      logger.debug('Starting form lock job...');

      let after = null;
      let numberLocked = 0;
      do {
        const { results, page } = await repository.find(20, after, {
          statusEquals: FormStatus.Draft,
          anonymousApplicantEquals: true,
          lastAccessedBefore: DateTime.now().minus(MAX_STALE_AGE).toJSDate(),
        });

        for (const result of results) {
          const { locked } = await result.lock(jobUser);
          numberLocked++;
          eventService.send(
            formLocked(apiId, jobUser, result, DateTime.fromJSDate(locked).plus(MAX_LOCKED_AGE).toJSDate())
          );
        }

        after = page.next;
      } while (after);

      logger.info(`Completed form lock job and locked ${numberLocked} forms.`);
    } catch (err) {
      logger.error(`Error encountered in form locking job. ${err}`);
    }
  };
}
