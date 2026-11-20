import { Logger } from 'winston';
import { SharePointRetryService } from '../sharepoint';

interface SharePointRetryJobProps {
  logger: Logger;
  service: SharePointRetryService;
}

export function createSharePointRetryJob({ logger, service }: SharePointRetryJobProps) {
  // A run can outlast the schedule when a push is slow, and a second run would only compete for the same pushes.
  let running = false;

  return async (): Promise<void> => {
    if (running) {
      return;
    }

    running = true;
    try {
      const attempted = await service.retryDue();
      if (attempted > 0) {
        logger.info(`Completed SharePoint push retry job and attempted ${attempted} push(es).`);
      }
    } catch (err) {
      logger.error(`Error encountered in SharePoint push retry job. ${err}`);
    } finally {
      running = false;
    }
  };
}
