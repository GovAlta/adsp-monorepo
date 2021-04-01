import { Connection, Channel } from 'amqplib';
import * as dashify from 'dashify';
import { Logger } from 'winston';
import { DomainEventService, DomainEvent } from '@core-services/core-common';

export class AmqpDomainEventService implements DomainEventService {
  connected = false;
  channel: Channel = null;

  constructor(private logger: Logger, private connection: Connection) {
    connection.on('close', () => {
      this.connected = false;
    });
    connection
      .createChannel()
      .then((channel) => {
        channel.assertExchange('domain-events', 'topic');
        this.connected = true;
      })
      .catch((err) => logger.error(`Error encountered initializing domain events exchange: ${err}`));
  }

  isConnected() {
    return this.connected;
  }

  send(event: DomainEvent) {
    (this.channel
      ? Promise.resolve(this.channel)
      : this.connection.createChannel().then((channel) => {
          this.channel = channel;
          return channel;
        })
    ).then((channel) => {
      const routingKey = this.getRoutingKey(event);
      const { namespace, name, timestamp, correlationId, ...payload } = event;

      try {
        channel.publish('domain-events', routingKey, Buffer.from(JSON.stringify(payload)), {
          contentType: 'application/json',
          headers: {
            namespace,
            name,
            timestamp: timestamp.toISOString(),
          },
          correlationId,
        });
      } catch (err) {
        this.logger.error(`Error encountered on sending domain event: ${err}`);
        this.channel.close();
        this.channel = null;
      }

      this.logger.debug(`Sent domain event with routing key: ${routingKey}`);
    });
  }

  private getRoutingKey({ namespace, name }: DomainEvent) {
    return `${dashify(namespace)}:${dashify(name)}`;
  }
}
