import { InvalidOperationError } from '@core-services/core-common';
import { Logger } from 'winston';
import { Notification, Providers } from '../types';

interface SendNotificationJobProps {
  logger: Logger;
  providers: Providers;
}

export const createSendNotificationJob = ({ logger, providers }: SendNotificationJobProps) => async (
  notification: Notification,
  done: (err?: unknown) => void
): Promise<void> => {
  const provider = providers[notification.channel];
  if (!provider) {
    // Note: This is not recoverable since the providers are statically defined right now.
    throw new InvalidOperationError(`No provider found for channel: ${notification.channel}`);
  } else {
    try {
      await provider.send(notification);
      logger.debug(`Sent of type '${notification.typeId}' to ${notification.to} via ${notification.channel} provider.`);
      done();
    } catch (err) {
      logger.warn(`Error encountered in ${notification.channel} provider. ${err}`);
      done(err);
    }
  }
};
