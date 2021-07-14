import { EventService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Logger } from 'winston';
import { notificationSent } from '../events';
import { Notification, Providers } from '../types';

interface SendNotificationJobProps {
  logger: Logger;
  eventService: EventService;
  providers: Providers;
}

export const createSendNotificationJob = ({ logger, eventService, providers }: SendNotificationJobProps) => async (
  notification: Notification,
  done: (err?: unknown) => void
): Promise<void> => {
  logger.debug(
    `Processing notification of type '${notification.type.id}' to ${notification.to} via ${notification.channel} provider.`
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
        `Sent notification of type '${notification.type.id}' to ${notification.to} via ${notification.channel} provider.`
      );
      done();
    } catch (err) {
      logger.warn(`Error encountered in ${notification.channel} provider. ${err}`);
      done(err);
    }
  }
};
