import { AdspId } from '@abgov/adsp-service-sdk';
import { AmqpWorkQueueService } from '@core-services/core-common';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import type { Logger } from 'winston';
import { ApplicationEvent, healthCheckStartedEvent, healthCheckStoppedEvent } from '../events';
import { HealthCheckControllerJobType, HealthCheckControllerWorkItem } from './HealthCheckControllerWorkItem';

const queueName = 'health-check-started-request';

export class HealthCheckQueueService extends AmqpWorkQueueService<HealthCheckControllerWorkItem> {
  constructor(connection: AmqpConnectionManager, logger: Logger) {
    super(queueName, logger, connection);
  }

  protected convertMessage(msg: ConsumeMessage): HealthCheckControllerWorkItem {
    const { timestamp, tenantId, name } = msg.properties.headers;
    const { application }: { application: ApplicationEvent } = JSON.parse(msg.content.toString());
    switch (name) {
      case healthCheckStartedEvent:
        return this.#getWorkItem('start', application, timestamp, tenantId);
      case healthCheckStoppedEvent:
        return this.#getWorkItem('stop', application, timestamp, tenantId);
      default:
        return null;
    }
  }

  #getWorkItem = (
    work: HealthCheckControllerJobType,
    event: ApplicationEvent,
    timestamp: string,
    tenantId: string
  ): HealthCheckControllerWorkItem => {
    return {
      work: work,
      url: event.url,
      applicationId: event.id,
      timestamp: new Date(timestamp),
      tenantId: AdspId.parse(`${tenantId}`),
    };
  };

  protected async assertQueueConfiguration(channel: ConfirmChannel): Promise<void> {
    await super.assertQueueConfiguration(channel);
    await channel.assertExchange('domain-events', 'topic');
    await channel.bindQueue(this.queue, 'domain-events', `status-service.*.*`);
  }
}
