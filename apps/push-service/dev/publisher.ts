import { connect } from 'amqp-connection-manager';
import type { ChannelWrapper } from 'amqp-connection-manager';
import { v7 as uuidv7 } from 'uuid';
import { config } from './config';

export interface DemoEvent {
  id?: string;
  namespace: string;
  name: string;
  context?: Record<string, string | number | boolean>;
  payload: Record<string, unknown>;
}

/**
 * Publishes to the domain-events exchange in the same format as event-service (AmqpDomainEventService).
 */
export async function createPublisher(): Promise<{ publish(event: DemoEvent): Promise<string>; close(): Promise<void> }> {
  const connection = connect({ hostname: config.amqpHost, username: config.amqpUser, password: config.amqpPassword });
  const channel: ChannelWrapper = connection.createChannel({
    json: false,
    setup: (ch) => ch.assertExchange('domain-events', 'topic'),
  });
  await channel.waitForConnect();

  return {
    async publish({ id = uuidv7(), namespace, name, context = {}, payload }) {
      const correlationId = typeof context.itemId === 'string' ? context.itemId : undefined;
      await channel.publish(
        'domain-events',
        `${namespace}.${name}.${config.tenantId}`,
        Buffer.from(JSON.stringify(payload)),
        {
          contentType: 'application/json',
          messageId: id,
          headers: {
            id,
            namespace,
            name,
            tenantId: config.tenantId,
            correlationId,
            context,
            timestamp: new Date().toISOString(),
          },
          correlationId,
        },
      );
      return id;
    },
    async close() {
      await channel.close();
      await connection.close();
    },
  };
}
