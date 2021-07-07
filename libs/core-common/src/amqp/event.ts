import { AdspId } from '@abgov/adsp-service-sdk';
import { Connection, Channel, ConsumeMessage } from 'amqplib';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { DomainEvent, DomainEventSubscriberService } from '../event';
import { WorkItem } from '../work';
import { AmqpWorkQueueService } from './work';

export class AmqpEventSubscriberService
  extends AmqpWorkQueueService<DomainEvent>
  implements DomainEventSubscriberService {
  constructor(queue: string, logger: Logger, connection: Connection) {
    super(queue, logger, connection);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getItems(): Observable<WorkItem<DomainEvent>> {
    return super
      .getItems()
      .pipe(map((e) => ({ item: { ...e.item, tenantId: AdspId.parse(`${e.item.tenantId}`) }, done: e.done })));
  }

  protected convertMessage(msg: ConsumeMessage): DomainEvent {
    const payload = JSON.parse(msg.content.toString());
    const headers = msg.properties.headers;

    return ({ ...headers, payload } as unknown) as DomainEvent;
  }

  protected async assertQueueConfiguration(channel: Channel): Promise<void> {
    await super.assertQueueConfiguration(channel);
    await channel.assertExchange('domain-events', 'topic');
    await channel.bindQueue(this.queue, 'domain-events', '#');
  }
}
