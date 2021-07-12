import { Subscribable } from 'rxjs';
import { Logger } from 'winston';
import { AdspId, ConfigurationService, EventService, TokenProvider } from '@abgov/adsp-service-sdk';
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
  eventService: EventService;
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
  eventService,
  templateService,
  events,
  queueService,
  subscriptionRepository,
  providers,
}: JobProps): void => {
  const sendNotificationJob = createSendNotificationJob({
    logger,
    eventService,
    providers,
  });

  const processEventJob = createProcessEventJob({
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    eventService,
    templateService,
    subscriptionRepository,
    queueService,
  });

  events.subscribe(({ item, done }) => processEventJob(item, done));

  queueService.getItems().subscribe(({ item, done }) => sendNotificationJob(item, done));
};
