import { Connection, Channel } from 'amqplib';
import * as dashify from 'dashify';
import { Logger } from 'winston';
import { InvalidOperationError } from '@core-services/core-common';
import { Observable, Subscribable } from 'rxjs';
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
      await channel.assertExchange('domain-events', 'topic');
      await channel.assertQueue('event-log');
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
    const { namespace, name, timestamp, tenantId, correlationId, payload } = event;

    try {
      this.channel.publish('domain-events', routingKey, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        headers: {
          namespace,
          name,
          tenantId: `${tenantId}`,
          correlationId,
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

  getEvents(): Subscribable<DomainEventWorkItem> {
    return new Observable<DomainEventWorkItem>((sub) => {
      (this.channel
        ? Promise.resolve(this.channel)
        : this.connection.createChannel().then((channel) => {
            this.channel = channel;
            return channel;
          })
      ).then((channel) =>
        channel.consume('event-log', (msg) => {
          const payload = JSON.parse(msg.content.toString());
          const headers = msg.properties['headers'];
          sub.next({
            event: { ...headers, payload } as DomainEvent,
            done: () => channel.ack(msg),
          });
        })
      );
    });
  }

  private getRoutingKey({ namespace, name }: DomainEvent) {
    return `${dashify(namespace)}:${dashify(name)}`;
  }
}
