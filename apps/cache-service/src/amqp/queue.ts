import { AmqpEventSubscriberService } from '@core-services/core-common';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import type { Logger } from 'winston';

export class AmqpCacheQueueService extends AmqpEventSubscriberService {
  constructor(logger: Logger, connection: AmqpConnectionManager) {
    super('cache-service-work', logger, connection);
  }
}
