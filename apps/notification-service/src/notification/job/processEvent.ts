import type { AdspId, ConfigurationService, EventService, TokenProvider } from '@abgov/adsp-service-sdk';
import type { DomainEvent, WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import type { Notification } from '../types';
import type { SubscriptionRepository } from '../repository';
import type { TemplateService } from '../template';
import { NotificationConfiguration } from '../configuration';
import { notificationsGenerated } from '../events';

interface ProcessEventJobProps {
  logger: Logger;
  serviceId: AdspId;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  eventService: EventService;
  templateService: TemplateService;
  subscriptionRepository: SubscriptionRepository;
  queueService: WorkQueueService<Notification>;
}

export const createProcessEventJob = ({
  logger,
  serviceId,
  tokenProvider,
  configurationService,
  eventService,
  templateService,
  subscriptionRepository,
  queueService,
}: ProcessEventJobProps) => async (event: DomainEvent, done: (err?: unknown) => void): Promise<void> => {
  const { tenantId, namespace, name } = event;
  logger.debug(`Processing event ${namespace}:${name} for tenant ${tenantId}...`);

  // Skip processing of any event from the notification-service namespace.
  // Sending notifications for notification related events could result in infinite loops.
  if (namespace === serviceId.service) {
    done();
    logger.debug(`Skip processing ${namespace}:${name} for notifications since it's a ${serviceId} event`);
    return;
  }

  try {
    const token = await tokenProvider.getAccessToken();
    const [configuration] = await configurationService.getConfiguration<NotificationConfiguration>(
      serviceId,
      token,
      tenantId
    );

    const types = configuration?.getEventNotificationTypes(event) || [];
    let count = 0;
    for (let i = 0; i < types.length; i++) {
      const type = types[i];

      // Page through all subscriptions and generate notifications.
      const notifications = [];
      let after: string = null;
      do {
        const { results, page } = await subscriptionRepository.getSubscriptions(type, 1000, after);
        const pageNotifications = type.generateNotifications(templateService, event, results);
        notifications.push(...pageNotifications);
        after = page.next;
      } while (after);

      notifications.forEach((notification) => queueService.enqueue(notification));
      eventService.send(notificationsGenerated(event, type, notifications.length));

      count += notifications.length;
      logger.debug(
        `Generated ${notifications.length} notifications of type ${type.name} (ID: ${type.id}) for ${namespace}:${name} for tenant ${tenantId}.`
      );
    }

    if (count > 0) {
      logger.info(`Generated ${count} notifications for event ${namespace}:${name} for tenant ${tenantId}.`);
    } else {
      logger.debug(`Processed event ${namespace}:${name} for tenant ${tenantId} with no notifications generated.`);
    }

    done();
  } catch (err) {
    logger.warn(`Error encountered on processing event ${namespace}:${name}. ${err}`);
    done(err);
  }
};
