import { AdspId } from '@abgov/adsp-service-sdk';
import { AmqpWorkQueueService } from '@core-services/core-common';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import type { Logger } from 'winston';
import { File, FileServiceWorkItem, FILE_DELETED_EVENT, FILE_UPLOADED_EVENT } from '../file';

export class AmqpFileQueueService extends AmqpWorkQueueService<FileServiceWorkItem> {
  constructor(logger: Logger, connection: AmqpConnectionManager) {
    super('file-service-work', logger, connection);
  }

  protected convertMessage(msg: ConsumeMessage): FileServiceWorkItem {
    const { file }: { file: File } = JSON.parse(msg.content.toString());
    const { timestamp, tenantId, name } = msg.properties.headers;

    return {
      work: name === FILE_UPLOADED_EVENT ? 'scan' : name === FILE_DELETED_EVENT ? 'delete' : 'unknown',
      file,
      timestamp: new Date(timestamp),
      tenantId: AdspId.parse(`${tenantId}`),
    };
  }

  protected async assertQueueConfiguration(channel: ConfirmChannel): Promise<void> {
    await super.assertQueueConfiguration(channel);
    await channel.assertExchange('domain-events', 'topic');
    await channel.bindQueue(this.queue, 'domain-events', 'file-service.*.*');
  }
}
