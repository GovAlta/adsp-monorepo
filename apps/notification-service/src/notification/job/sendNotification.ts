import { EventService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Logger } from 'winston';
import { notificationSendFailed, notificationSent } from '../events';
import { NotificationWorkItem, Providers } from '../types';

interface SendNotificationJobProps {
  logger: Logger;
  eventService: EventService;
  providers: Providers;
}

const LOG_CONTEXT = { context: 'SendNotificationJob' };
export const createSendNotificationJob =
  ({ logger, eventService, providers }: SendNotificationJobProps) =>
  async (notification: NotificationWorkItem, retryOnError: boolean, done: (err?: unknown) => void): Promise<void> => {
    logger.debug(
      `Processing notification of type '${notification.type.id}' to ${notification.to} via ${notification.channel} provider.`,
      { ...LOG_CONTEXT, tenant: notification.tenantId?.toString() }
    );
    const provider = providers[notification.channel];
    if (!provider) {
      // Note: This is not recoverable since the providers are statically defined right now.
      throw new InvalidOperationError(`No provider found for channel: ${notification.channel}`);
    } else {
      try {
        await provider.send(notification);
        eventService.send(notificationSent(notification));
        logger.debug(
          `Sent notification of type '${notification.type.id}' to ${notification.to} via ${notification.channel} provider.`,
          { ...LOG_CONTEXT, tenant: notification.tenantId?.toString() }
        );
        done();
      } catch (err) {
        logger.warn(`Error encountered in ${notification.channel} provider. ${err}`, {
          ...LOG_CONTEXT,
          tenant: notification.tenantId?.toString(),
        });
        done(err);
        if (!retryOnError) {
          eventService.send(notificationSendFailed(notification, err.message));
        }
      }
    }
  };
