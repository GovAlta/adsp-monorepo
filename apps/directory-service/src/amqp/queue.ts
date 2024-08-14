import { AmqpEventSubscriberService } from '@core-services/core-common';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import type { Logger } from 'winston';

export class AmqpDirectoryQueueService extends AmqpEventSubscriberService {
  constructor(logger: Logger, connection: AmqpConnectionManager) {
    super('directory-service-work', logger, connection);
  }
}
