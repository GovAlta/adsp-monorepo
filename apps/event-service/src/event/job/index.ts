import type { Subscribable } from 'rxjs';
import type { Logger } from 'winston';
import { AdspId, adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import type { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import type { DomainEventWorkItem } from '@core-services/core-common';
import { createLogEventJob } from './logEvent';

export interface JobProps {
  serviceId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  events: Subscribable<DomainEventWorkItem>;
}

export const createJobs = async ({
  serviceId,
  logger,
  directory,
  events,
  tokenProvider,
  configurationService,
}: JobProps): Promise<void> => {
  try {
    const valueServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:value-service:v1`);

    const logEventJob = createLogEventJob({ serviceId, logger, valueServiceUrl, tokenProvider, configurationService });
    events.subscribe((next) => {
      logEventJob(next.item, next.done);
    });
  } catch (err) {
    logger.error(`Error encountered in creation of event jobs. ${err}`, { context: 'EventJobs' });
  }
};
