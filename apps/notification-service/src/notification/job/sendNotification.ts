import { Logger } from 'winston';
import { Notification, Providers } from '../types';

interface SendNotificationJobProps {
  logger: Logger
  providers: Providers
}

export const createSendNotificationJob = ({
  logger,
  providers
}: SendNotificationJobProps) => (
  notification: Notification, 
  done: () => void
) => {

  const provider = providers[notification.channel];
  if (!provider) {
    logger.error(`No provider found for channel: ${notification.channel}`);
    done();
  } else {
    provider.send(notification)
    .then(() => done())
    .catch((err) => {
      logger.warn(err);
    });
  }
}
