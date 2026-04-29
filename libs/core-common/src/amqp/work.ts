import { ConfirmChannel, ConsumeMessage, Options } from 'amqplib';
import { Logger } from 'winston';
import { Observable, Subscriber } from 'rxjs';
import { context as otelContext, propagation, trace as otelTrace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { WorkItem, WorkQueueService } from '../work';
import { InvalidOperationError } from '../errors';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

export class AmqpWorkQueueService<T> implements WorkQueueService<T> {
  connected = false;
  channel: ChannelWrapper = null;
  private tracer = otelTrace.getTracer('core-common.amqp');

  constructor(
    protected queue: string,
    protected logger: Logger,
    protected connection: AmqpConnectionManager,
    protected consumerOptions: Options.Consume = {},
  ) {}

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
      const headers = {} as Record<string, unknown>;
      propagation.inject(otelContext.active(), headers);

      const sent = await this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(item)), {
        contentType: 'application/json',
        headers,
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
    channel.consume(
      this.queue,
      (msg) => {
        // If the message is redelivered, then don't requeue on failure, and let it go to dead letter.
        const requeueOnFail = !msg.fields?.redelivered;
        let span;
        try {
          const extractedContext = propagation.extract(otelContext.active(), msg.properties?.headers || {});
          span = this.tracer.startSpan(
            `amqp consume ${msg.fields?.routingKey || this.queue}`,
            {
              kind: SpanKind.CONSUMER,
              attributes: {
                'messaging.system': 'rabbitmq',
                'messaging.operation': 'process',
                'messaging.destination.name': this.queue,
                'messaging.rabbitmq.routing_key': msg.fields?.routingKey,
              },
            },
            extractedContext,
          );
          const contextWithSpan = otelTrace.setSpan(extractedContext, span);

          otelContext.with(contextWithSpan, () => {
            sub.next({
              item: this.convertMessage(msg),
              retryOnError: requeueOnFail,
              done: (err) => {
                if (err) {
                  const exception = err instanceof Error ? err : new Error(String(err));
                  span.recordException(exception);
                  span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: err instanceof Error ? err.message : String(err),
                  });
                  channel.nack(msg, false, requeueOnFail);
                  if (!requeueOnFail) {
                    this.logger.error(
                      `Redelivered message ${msg.fields.routingKey} processing failed and will be dead lettered.`,
                    );
                  }
                } else {
                  span.setStatus({ code: SpanStatusCode.OK });
                  channel.ack(msg);
                }

                span.end();
              },
            });
          });
        } catch (err) {
          const exception = err instanceof Error ? err : new Error(String(err));
          span?.recordException(exception);
          span?.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
          span?.end();
          this.logger.error(
            `Processing of item with routing key ${msg?.fields?.routingKey} failed and will NOT be retried. ${err}`,
          );
          channel.nack(msg, false, false);
        }
      },
      { ...this.consumerOptions, prefetch: 1 },
    );
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
