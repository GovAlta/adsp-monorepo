import { Connection, Channel } from 'amqplib';
import * as dashify from 'dashify';
import { Logger } from 'winston';
import { Observable } from 'rxjs';
import { DomainEvent } from '../event';
import { WorkItem, WorkQueueService } from '../work';


export class AmqpWorkQueueService<T> implements WorkQueueService<T> {

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
      channel.assertQueue(this.queue)
    )
    .then(() => {
      this.connected =true;
    })
    .catch((err) => {
      this.logger.error(`Error encountered initializing work queue: ${err}`)
    });
  }

  enqueue(item: T) {
    return (
      this.channel ? 
        Promise.resolve(this.channel) :
        this.connection.createChannel().then(channel => {
          this.channel = channel;
          return channel;
        })
    )
    .then((channel) => {
      
      const result = channel.sendToQueue(
        this.queue,
        Buffer.from(JSON.stringify(item)), 
        { 
          contentType: 'application/json'
        }
      );
      
      this.logger.debug(`Sent work item to queue: ${this.queue}`);
      
      return result;
    })
    .catch(err => {
      this.logger.error(`Error encountered on sending work item: ${err}`);
      this.channel.close();
      this.channel = null;

      return false;
    });
  }
  
  getItems(): Observable<WorkItem<T>> {
    return new Observable<WorkItem<T>>((sub) => {
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
            sub.next({
              item: payload,
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
