import type { Connection } from 'amqplib';
import * as dashify from 'dashify';
import type { Logger } from 'winston';
import type { DomainEvent } from '@core-services/core-common';
import { AmqpEventSubscriberService, InvalidOperationError } from '@core-services/core-common';
import type { DomainEventService } from '../event';

export class AmqpDomainEventService extends AmqpEventSubscriberService implements DomainEventService {
  constructor(logger: Logger, connection: Connection) {
    super('event-log', logger, connection);
  }

  async send(event: DomainEvent): Promise<void> {
    if (!this.connected) {
      throw new InvalidOperationError('Service must be connected before events can be sent.');
    }

    if (!this.channel) {
      this.channel = await this.connection.createChannel();
    }

    const routingKey = this.getRoutingKey(event);
    const { namespace, name, timestamp, tenantId, correlationId, context, payload } = event;

    try {
      await this.channel.publish('domain-events', routingKey, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        headers: {
          namespace,
          name,
          tenantId: `${tenantId}`,
          correlationId,
          context,
          timestamp: timestamp.toISOString(),
        },
        correlationId,
      });

      this.logger.debug(`Sent domain event with routing key: ${routingKey}`);
    } catch (err) {
      this.logger.error(`Error encountered on sending domain event: ${err}`);
      this.channel.close();
      this.channel = null;
    }
  }

  private getRoutingKey({ namespace, name, tenantId }: DomainEvent) {
    return `${dashify(namespace)}.${dashify(name)}.${tenantId}`;
  }
}
