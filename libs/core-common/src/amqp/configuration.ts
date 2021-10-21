import { AdspId } from '@abgov/adsp-service-sdk';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import type { Logger } from 'winston';
import { AmqpWorkQueueService } from './work';

export interface ConfigurationUpdate {
  timestamp: Date;
  tenantId: AdspId;
  serviceId: AdspId;
}

export class AmqpConfigurationUpdateSubscriberService extends AmqpWorkQueueService<ConfigurationUpdate> {
  constructor(logger: Logger, connection: AmqpConnectionManager) {
    // Empty string queue name for server-named queue.
    super('', logger, connection);
  }

  protected convertMessage(msg: ConsumeMessage): ConfigurationUpdate {
    const { namespace, name } = JSON.parse(msg.content.toString());
    const headers = msg.properties.headers;

    return {
      timestamp: new Date(headers.timestamp),
      tenantId: AdspId.parse(`${headers.tenantId}`),
      serviceId: AdspId.parse(`urn:ads:${namespace}:${name}`),
    };
  }

  protected async assertQueueConfiguration(channel: ConfirmChannel): Promise<void> {
    await channel.assertQueue(this.queue, {
      exclusive: true,
    });
    await channel.assertExchange('domain-events', 'topic');
    await channel.bindQueue(this.queue, 'domain-events', 'configuration-service.*.*');
  }
}
