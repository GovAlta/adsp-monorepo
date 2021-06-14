import { Connection, Channel } from 'amqplib';
import * as dashify from 'dashify';
import { Logger } from 'winston';
import { InvalidOperationError } from '@core-services/core-common';
import { Observable, Subscribable, Subscriber } from 'rxjs';
import { DomainEvent, DomainEventService, DomainEventSubscriberService, DomainEventWorkItem } from '../event';

export class AmqpDomainEventService implements DomainEventService, DomainEventSubscriberService {
  connected = false;
  channel: Channel = null;

  constructor(private logger: Logger, private connection: Connection) {
    connection.on('close', () => {
      this.connected = false;
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<boolean> {
    try {
      const channel = await this.connection.createChannel();
      await channel.assertExchange('event-log-dead-letter', 'direct');
      await channel.assertQueue('undelivered-event-log');
      await channel.bindQueue('undelivered-event-log', 'event-log-dead-letter', '#');

      await channel.assertExchange('domain-events', 'topic');
      await channel.assertQueue('event-log', {
        arguments: {
          'x-dead-letter-exchange': 'event-log-dead-letter',
          'x-message-ttl': 300000,
        },
      });
      await channel.bindQueue('event-log', 'domain-events', '#');

      this.connected = true;
    } catch (err) {
      this.logger.error(`Error encountered initializing domain events exchange: ${err}`);
    }

    return this.connected;
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

  #onSubscribed = async (sub: Subscriber<DomainEventWorkItem>): Promise<void> => {
    if (!this.channel) {
      this.channel = await this.connection.createChannel();
    }
    const channel = this.channel;
    channel.consume('event-log', (msg) => {
      const payload = JSON.parse(msg.content.toString());
      const headers = msg.properties.headers;

      try {
        sub.next({
          event: { ...headers, payload } as DomainEvent,
          done: (err) => (err ? channel.nack(msg, false, true) : channel.ack(msg)),
        });
      } catch (err) {
        this.logger.error(
          `Processing of event with routing key ${msg.fields.routingKey} failed and will NOT be retried. ${err}`
        );
        channel.nack(msg, false, false);
      }
    });
  };

  getEvents(): Subscribable<DomainEventWorkItem> {
    if (!this.connected) {
      throw new InvalidOperationError('Service must be connected before events can be subscribed.');
    }

    return new Observable<DomainEventWorkItem>((sub) => {
      this.#onSubscribed(sub);
    });
  }

  private getRoutingKey({ namespace, name }: DomainEvent) {
    return `${dashify(namespace)}:${dashify(name)}`;
  }
}
