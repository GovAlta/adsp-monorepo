import { getContextTrace } from '@abgov/adsp-service-sdk';
import { SpanKind, SpanStatusCode, trace as otelTrace } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';
import type { DomainEvent } from '@core-services/core-common';
import { AmqpEventSubscriberService, InvalidOperationError } from '@core-services/core-common';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import { Options } from 'amqplib';
import * as dashify from 'dashify';
import type { Logger } from 'winston';
import type { DomainEventService } from '../event';

export class AmqpDomainEventService extends AmqpEventSubscriberService implements DomainEventService {
  constructor(logger: Logger, connection: AmqpConnectionManager, consumerOptions: Options.Consume = {}) {
    super('event-log', logger, connection, consumerOptions);
  }

  async send(event: DomainEvent): Promise<void> {
    if (!this.connected) {
      throw new InvalidOperationError('Service must be connected before events can be sent.');
    }

    const routingKey = this.getRoutingKey(event);
    const { namespace, name, timestamp, tenantId, correlationId, context, payload } = event;

    // This is the platform's domain event publish path and it overrides the base class enqueue, so
    // it needs its own producer span. Named for the exchange rather than the routing key, since the
    // routing key embeds the tenant URN and would grow the span name set with tenants.
    await otelTrace
      .getTracer('event-service.amqp')
      .startActiveSpan(
        'publish domain-events',
        {
          kind: SpanKind.PRODUCER,
          attributes: {
            'messaging.system': 'rabbitmq',
            'messaging.operation': 'publish',
            'messaging.destination.name': 'domain-events',
            'messaging.rabbitmq.routing_key': routingKey,
            'adsp.event.namespace': namespace,
            'adsp.event.name': name,
          },
        },
        (span) => this.publishWithin(span, event, routingKey)
      );
  }

  private async publishWithin(span: Span, event: DomainEvent, routingKey: string): Promise<void> {
    const { namespace, name, timestamp, tenantId, correlationId, context, payload } = event;
    // Read inside the producer span so the propagated traceparent points at the publish, making the
    // consumer a child of the send rather than of whatever span was active upstream.
    const trace = getContextTrace();

    try {
      const sent = await this.channel.publish('domain-events', routingKey, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        headers: {
          namespace,
          name,
          tenantId: `${tenantId}`,
          correlationId,
          context,
          timestamp: timestamp.toISOString(),
          traceparent: trace?.toString(),
        },
        correlationId,
      });

      if (sent) {
        this.logger.debug(`Sent domain event with routing key: ${routingKey}`);
      } else {
        this.logger.error(
          `Failed to publish domain event with routing key '${routingKey}' due to server reject or close of connection.`
        );
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'broker rejected the publish' });
      }
    } catch (err) {
      this.logger.error(`Error encountered on sending domain event: ${err}`);
      span.recordException(err instanceof Error ? err : String(err));
      span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : String(err) });
    } finally {
      span.end();
    }
  }

  private getRoutingKey({ namespace, name, tenantId }: DomainEvent) {
    return `${dashify(namespace)}.${dashify(name)}.${tenantId}`;
  }
}
