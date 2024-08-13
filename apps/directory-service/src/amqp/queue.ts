import { AdspId } from '@abgov/adsp-service-sdk';
import { AmqpWorkQueueService } from '@core-services/core-common';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import type { Logger } from 'winston';
import { DirectoryWorkItem, Resource, TAGGED_RESOURCE } from '../directory';

export class AmqpDirectoryQueueService extends AmqpWorkQueueService<DirectoryWorkItem> {
  constructor(logger: Logger, connection: AmqpConnectionManager) {
    super('directory-service-work', logger, connection);
  }

  protected convertMessage(msg: ConsumeMessage): DirectoryWorkItem {
    const { resource }: { resource: Omit<Resource, 'urn'> & { isNew: boolean; urn: string } } = JSON.parse(
      msg.content.toString()
    );
    const { tenantId, name } = msg.properties.headers;

    return {
      work: name === TAGGED_RESOURCE && resource?.isNew ? 'resolve' : name,
      tenantId: AdspId.parse(`${tenantId}`),
      urn: resource?.urn ? AdspId.parse(resource.urn) : null,
    };
  }

  protected async assertQueueConfiguration(channel: ConfirmChannel): Promise<void> {
    await super.assertQueueConfiguration(channel);
    await channel.assertExchange('domain-events', 'topic');
    await channel.bindQueue(this.queue, 'domain-events', 'directory-service.*.*');
  }
}
