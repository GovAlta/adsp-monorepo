import {
  adspId,
  AdspId,
  ConfigurationService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import type { DomainEvent, WorkQueueService } from '@core-services/core-common';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import type { Notification, NotificationWorkItem } from '../types';
import type { SubscriptionRepository } from '../repository';
import { NotificationConfiguration } from '../configuration';
import { notificationGenerationFailed, notificationsGenerated } from '../events';

interface ProcessEventJobProps {
  logger: Logger;
  serviceId: AdspId;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
  directory: ServiceDirectory;
  configurationService: ConfigurationService;
  eventService: EventService;
  subscriptionRepository: SubscriptionRepository;
  queueService: WorkQueueService<NotificationWorkItem>;
}

const LOG_CONTEXT = { context: 'ProcessEventJob' };
export const createProcessEventJob =
  ({
    logger,
    serviceId,
    tokenProvider,
    tenantService,
    directory,
    configurationService,
    eventService,
    subscriptionRepository,
    queueService,
  }: ProcessEventJobProps) =>
  async (event: DomainEvent, retryOnError: boolean, done: (err?: unknown) => void): Promise<void> => {
    const { tenantId, namespace, name } = event;
    logger.debug(`Processing event ${namespace}:${name} for tenant ${tenantId}...`);

    // Skip processing of any event from the notification-service namespace.
    // Sending notifications for notification related events could result in infinite loops.
    if (namespace === serviceId.service) {
      done();
      logger.debug(`Skip processing ${namespace}:${name} for notifications since it's a ${serviceId} event`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
      return;
    }

    // This is a unique value to provide traceability of one execution of notification generation.
    const generationId = uuid();
    try {
      const token = await tokenProvider.getAccessToken();
      const configuration = await configurationService.getConfiguration<
        NotificationConfiguration,
        NotificationConfiguration
      >(serviceId, token, tenantId);

      const types = configuration?.getEventNotificationTypes(event) || [];

      let count = 0;
      if (types.length > 0) {
        const tenant = await tenantService.getTenant(tenantId);
        const subscriberAppUrl = await directory.getServiceUrl(adspId`urn:ads:platform:subscriber-app`);

        for (const type of types) {
          try {
            const notifications: Notification[] = await type.generateNotifications(
              logger,
              subscriberAppUrl,
              subscriptionRepository,
              configuration,
              event,
              { tenant }
            );

            for (const notification of notifications) {
              queueService.enqueue({ generationId, ...notification });
            }

            if (notifications.length > 0) {
              eventService.send(notificationsGenerated(generationId, event, type, notifications.length));
            }

            count += notifications.length;
            logger.debug(
              `Generated ${notifications.length} notifications of type ${type.name} (ID: ${type.id}) for ${namespace}:${name} for tenant ${tenantId}.`,
              {
                ...LOG_CONTEXT,
                tenant: tenantId?.toString(),
              }
            );
          } catch (err) {
            eventService.send(notificationGenerationFailed(generationId, event, type, err.message));
          }
        }
      }

      if (count > 0) {
        logger.info(`Generated ${count} notifications for event ${namespace}:${name} for tenant ${tenantId}.`, {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      } else {
        logger.debug(`Processed event ${namespace}:${name} for tenant ${tenantId} with no notifications generated.`, {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }

      done();
    } catch (err) {
      logger.warn(`Error encountered on processing event ${namespace}:${name}. ${err}`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
      done(err);
    }
  };
