import { Subscribable } from 'rxjs';
import { Logger } from 'winston';
import { AdspId, ConfigurationService, TokenProvider } from '@abgov/adsp-service-sdk';
import { DomainEventWorkItem, WorkQueueService } from '@core-services/core-common';
import { createProcessEventJob } from './processEvent';
import { SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import { Notification, Providers } from '../types';
import { createSendNotificationJob } from './sendNotification';

interface JobProps {
  serviceId: AdspId;
  logger: Logger;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  templateService: TemplateService;
  events: Subscribable<DomainEventWorkItem>;
  queueService: WorkQueueService<Notification>;
  subscriptionRepository: SubscriptionRepository;
  providers: Providers;
}

export const createJobs = ({
  serviceId,
  logger,
  tokenProvider,
  configurationService,
  templateService,
  events,
  queueService,
  subscriptionRepository,
  providers,
}: JobProps): void => {
  const sendNotificationJob = createSendNotificationJob({
    logger,
    providers,
  });

  const processEventJob = createProcessEventJob({
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    templateService,
    subscriptionRepository,
    queueService,
  });

  events.subscribe(({ item, done }) => processEventJob(item, done));

  queueService.getItems().subscribe(({ item, done }) => sendNotificationJob(item, done));
};
