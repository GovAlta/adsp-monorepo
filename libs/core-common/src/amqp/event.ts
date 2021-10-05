import { AdspId } from '@abgov/adsp-service-sdk';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import type { Logger } from 'winston';
import type { DomainEvent, DomainEventSubscriberService } from '../event';
import { AmqpWorkQueueService } from './work';

export class AmqpEventSubscriberService
  extends AmqpWorkQueueService<DomainEvent>
  implements DomainEventSubscriberService
{
  constructor(queue: string, logger: Logger, connection: AmqpConnectionManager) {
    super(queue, logger, connection);
  }

  protected convertMessage(msg: ConsumeMessage): DomainEvent {
    const payload = JSON.parse(msg.content.toString());
    const headers = msg.properties.headers;

    return {
      ...headers,
      payload,
      timestamp: new Date(headers.timestamp),
      tenantId: AdspId.parse(`${headers.tenantId}`),
    } as DomainEvent;
  }

  protected async assertQueueConfiguration(channel: ConfirmChannel): Promise<void> {
    await super.assertQueueConfiguration(channel);
    await channel.assertExchange('domain-events', 'topic');
    await channel.bindQueue(this.queue, 'domain-events', '#');
  }
}
