import {
  AmqpEventSubscriberService as BaseAmqpEventSubscriberService,
  DomainEventSubscriberService,
} from '@core-services/core-common';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import type { Logger } from 'winston';

/**
 * Push service specific event service that uses server named queues (i.e. specific to each connection) and without dead-letter.
 * This is necessarily since events need to go to clients connected to any instance of push service.
 * @export
 * @class AmqpEventSubscriberService
 * @extends {BaseAmqpEventSubscriberService}
 * @implements {DomainEventSubscriberService}
 */
export class AmqpEventSubscriberService extends BaseAmqpEventSubscriberService implements DomainEventSubscriberService {
  constructor(logger: Logger, connection: AmqpConnectionManager) {
    // Empty queue name is for server named queues (per connection queues)
    super('', logger, connection);
  }

  protected async assertQueueConfiguration(channel: ConfirmChannel): Promise<void> {
    await channel.assertQueue(this.queue, {
      exclusive: true,
    });
    await channel.assertExchange('domain-events', 'topic');
    await channel.bindQueue(this.queue, 'domain-events', '#');
  }
}
