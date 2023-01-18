import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { Observable, Subscriber } from 'rxjs';
import { WorkItem, WorkQueueService } from '../work';
import { InvalidOperationError } from '../errors';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

export class AmqpWorkQueueService<T> implements WorkQueueService<T> {
  connected = false;
  channel: ChannelWrapper = null;

  constructor(protected queue: string, protected logger: Logger, protected connection: AmqpConnectionManager) {}

  isConnected(): boolean {
    return this.connected;
  }

  private setup = async (channel: ConfirmChannel): Promise<void> => {
    try {
      return await this.assertQueueConfiguration(channel);
    } catch (err) {
      this.logger.error(`Error encountered in configuring queue. ${err}`);
      throw err;
    }
  };

  protected async assertQueueConfiguration(channel: ConfirmChannel): Promise<void> {
    await channel.assertExchange(`${this.queue}-dead-letter`, 'topic');
    await channel.assertQueue(`undelivered-${this.queue}`, {
      arguments: {
        'x-queue-type': 'quorum',
      },
    });
    await channel.bindQueue(`undelivered-${this.queue}`, `${this.queue}-dead-letter`, '#');
    await channel.assertQueue(this.queue, {
      arguments: {
        'x-queue-type': 'quorum',
        'x-dead-letter-exchange': `${this.queue}-dead-letter`,
      },
    });
  }

  connect = async (): Promise<boolean> => {
    try {
      this.channel = this.connection.createChannel({
        json: false,
        setup: this.setup,
      });

      this.connected = true;
    } catch (err) {
      this.logger.error(`Error encountered initializing work queue: ${err}`);
    }

    return this.connected;
  };

  async enqueue(item: T): Promise<void> {
    try {
      const sent = await this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(item)), {
        contentType: 'application/json',
      });

      if (!sent) {
        this.logger.error(`Failed to enqueue work item due to broker rejection or connection close.`);
      }
    } catch (err) {
      this.logger.error(`Error encountered on sending work item: ${err}`);
    }
  }

  protected convertMessage(msg: ConsumeMessage): T {
    const payload = JSON.parse(msg.content.toString());
    const headers = msg.properties.headers;

    return { ...headers, ...payload } as unknown as T;
  }

  private onSubscribed = async (sub: Subscriber<WorkItem<T>>): Promise<void> => {
    const channel = this.channel;
    channel.consume(this.queue, (msg) => {
      // If the message is redelivered, then don't requeue on failure, and let it go to dead letter.
      const requeueOnFail = !msg.fields?.redelivered;
      try {
        sub.next({
          item: this.convertMessage(msg),
          retryOnError: requeueOnFail,
          done: (err) => {
            if (err) {
              channel.nack(msg, false, requeueOnFail);
              if (!requeueOnFail) {
                this.logger.error(
                  `Redelivered message ${msg.fields.routingKey} processing failed and will be dead lettered.`
                );
              }
            } else {
              channel.ack(msg);
            }
          },
        });
      } catch (err) {
        this.logger.error(
          `Processing of item with routing key ${msg?.fields?.routingKey} failed and will NOT be retried. ${err}`
        );
        channel.nack(msg, false, false);
      }
    });
  };

  getItems(): Observable<WorkItem<T>> {
    if (!this.connected) {
      throw new InvalidOperationError('Service must be connected before items can be subscribed.');
    }

    return new Observable<WorkItem<T>>((sub) => {
      this.onSubscribed(sub);
    });
  }
}
