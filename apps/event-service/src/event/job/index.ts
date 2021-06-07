import type { Subscribable } from 'rxjs';
import type { Logger } from 'winston';
import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createLogEventJob } from './logEvent';
import type { DomainEventWorkItem } from '../service';

export interface JobProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  events: Subscribable<DomainEventWorkItem>;
}

export const createJobs = async ({ logger, directory, events, tokenProvider }: JobProps): Promise<void> => {
  try {
    const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);

    const logEventJob = createLogEventJob({ logger, valueServiceUrl, tokenProvider });
    events.subscribe((next) => {
      logEventJob(next.event, next.done);
    });
  } catch (err) {
    logger.error(`Error encountered in creation of event jobs. ${err}`, { context: 'EventJobs' });
  }
};
