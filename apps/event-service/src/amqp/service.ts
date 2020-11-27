import { Connection, Channel } from 'amqplib';
import * as dashify from 'dashify';
import { Logger } from 'winston';
import { DomainEventService, DomainEvent, DomainEventWorkItem } from '@core-services/core-common';
import { Observable } from 'rxjs';

export class AmqpDomainEventService implements DomainEventService {

  connected = false;
  channel: Channel = null;

  constructor(private logger: Logger, private connection: Connection) {
    connection.on('close', () => {
      this.connected = false;
    });
  }

  isConnected() {
    return this.connected;
  }

  connect() {
    return this.connection.createChannel()
    .then(channel => {
      channel.assertExchange('domain-events', 'topic')
      .then(() => 
        channel.assertQueue('event-log')
      )
      .then(() => 
        channel.bindQueue('event-log', 'domain-events', '#')
      )
      this.connected = true;
    })
    .then(() => this)
    .catch((err) => {
      this.logger.error(`Error encountered initializing domain events exchange: ${err}`);
      return this;
    });
  }

  send(event: DomainEvent) {
    (
      this.channel ? 
        Promise.resolve(this.channel) :
        this.connection.createChannel().then(channel => {
          this.channel = channel;
          return channel;
        })
    ).then((channel) => {
      const routingKey = this.getRoutingKey(event);
      const {namespace, name, timestamp, correlationId, ...payload} = event;

      channel.publish(
        'domain-events', 
        routingKey, 
        Buffer.from(JSON.stringify(payload)), 
        { 
          contentType: 'application/json',
          headers: {
            namespace,
            name,
            timestamp: timestamp.toISOString()
          },
          correlationId
        }
      );
      
      this.logger.debug(`Sent domain event with routing key: ${routingKey}`);
    })
    .catch(err => {
      this.logger.error(`Error encountered on sending domain event: ${err}`);
      this.channel.close();
      this.channel = null;
    });
  }

  getEvents() {
    return new Observable<DomainEventWorkItem>((sub) => {
      (
        this.channel ? 
          Promise.resolve(this.channel) :
          this.connection.createChannel().then(channel => {
            this.channel = channel;
            return channel;
          })
      ).then((channel) => 
        channel.consume(
          'event-log', 
          (msg) => {
            const payload = JSON.parse(msg.content.toString());
            const headers = msg.properties['headers'];
            sub.next({
              event: {...headers, ...payload},
              done: () => channel.ack(msg)
            });
          }
        )
      )
    });
  }

  private getRoutingKey({namespace, name}: DomainEvent) {
    return `${dashify(namespace)}:${dashify(name)}`;
  }
}
