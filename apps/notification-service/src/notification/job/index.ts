import { Observable } from 'rxjs';
import { Logger } from 'winston';
import { DomainEventWorkItem, WorkQueueService } from '@core-services/core-common';
import { createProcessEventJob } from './processEvent';
import { NotificationTypeRepository, SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import { Notification, Providers } from '../types';
import { createSendNotificationJob } from './sendNotification';

interface JobProps {
  logger: Logger;
  templateService: TemplateService;
  events: Observable<DomainEventWorkItem>;
  queueService: WorkQueueService<Notification>;
  typeRepository: NotificationTypeRepository;
  subscriptionRepository: SubscriptionRepository;
  providers: Providers;
}

export const createJobs = ({
  logger,
  templateService,
  events,
  queueService,
  typeRepository,
  subscriptionRepository,
  providers,
}: JobProps) => {
  const sendNotificationJob = createSendNotificationJob({
    logger,
    providers,
  });

  // TODO: Notification send jobs should use a producer consumer queue to decouple sending
  // from event processing and provide mechanism for retries.
  const processEventJob = createProcessEventJob({
    templateService,
    typeRepository,
    subscriptionRepository,
    queueService,
  });

  events.subscribe((next) => processEventJob(next.event, next.done));

  queueService.getItems().subscribe((next) => sendNotificationJob(next.item, next.done));
};
