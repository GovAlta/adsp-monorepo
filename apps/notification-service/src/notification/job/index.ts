import { Subscribable } from 'rxjs';
import { Logger } from 'winston';
import {
  AdspId,
  ConfigurationService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import { DomainEventWorkItem, WorkQueueService } from '@core-services/core-common';
import { createProcessEventJob } from './processEvent';
import { SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import { NotificationWorkItem, Providers } from '../types';
import { createSendNotificationJob } from './sendNotification';

interface JobProps {
  serviceId: AdspId;
  logger: Logger;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
  directory: ServiceDirectory;
  configurationService: ConfigurationService;
  eventService: EventService;
  templateService: TemplateService;
  events: Subscribable<DomainEventWorkItem>;
  queueService: WorkQueueService<NotificationWorkItem>;
  subscriptionRepository: SubscriptionRepository;
  providers: Providers;
}

export const createJobs = ({
  serviceId,
  logger,
  tokenProvider,
  tenantService,
  directory,
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
    tenantService,
    directory,
    configurationService,
    eventService,
    templateService,
    subscriptionRepository,
    queueService,
  });

  events.subscribe(({ item, done }) => processEventJob(item, done));

  queueService.getItems().subscribe(({ item, retryOnError, done }) => sendNotificationJob(item, retryOnError, done));
};
