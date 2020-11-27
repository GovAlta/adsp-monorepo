import { Connection, Channel } from 'amqplib';
import { Logger } from 'winston';
import { Observable } from 'rxjs';
import { DomainEventSubscriberService, DomainEventWorkItem } from '../event';

export class AmqpEventSubscriberService implements DomainEventSubscriberService {

  connected = false;
  channel: Channel = null;

  constructor(private queue: string, private logger: Logger, private connection: Connection) {
    connection.on('close', () => {
      this.connected = false;
    });
  }

  isConnected() {
    return this.connected;
  }

  connect() {
    return this.connection.createChannel()
    .then(channel => 
      channel.assertExchange('domain-events', 'topic')
      .then(() => 
        channel.assertQueue(this.queue)
      )
      .then(() => 
        channel.bindQueue(this.queue, 'domain-events', '#')
      )
    )
    .then(() => {
      this.connected =true;
    })
    .catch((err) => {
      this.logger.error(`Error encountered initializing domain events exchange: ${err}`)
    });
  }
  
  getEvents(): Observable<DomainEventWorkItem> {
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
          this.queue, 
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
}
