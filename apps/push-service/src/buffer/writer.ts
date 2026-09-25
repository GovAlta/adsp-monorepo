import type { AdspId, ConfigurationService, TokenProvider } from '@abgov/adsp-service-sdk';
import type { DomainEvent, DomainEventSubscriberService } from '@core-services/core-common';
import type { Subscription } from 'rxjs';
import type { Logger } from 'winston';
import { StreamEntity } from '../push/model';
import type { RedisEventBuffer } from './buffer';

/**
 * Determines if an event should be buffered, i.e. at least one stream in the tenant includes it.
 */
export type BufferInterest = (event: DomainEvent) => Promise<boolean>;

export function hasStreamInterest(configuration: Record<string, unknown>, event: DomainEvent): boolean {
  return Object.values(configuration || {}).some((value) => value instanceof StreamEntity && !!value.matchEvent(event));
}

export function createStreamInterest(
  configurationService: ConfigurationService,
  tokenProvider: TokenProvider,
  serviceId: AdspId,
): BufferInterest {
  return async (event) => {
    const token = await tokenProvider.getAccessToken();
    // Combined configuration (tenant and core streams) as StreamEntity instances; this is cached by the SDK.
    const configuration = await configurationService.getConfiguration<Record<string, unknown>, Record<string, unknown>>(
      serviceId,
      token,
      event.tenantId,
    );
    return hasStreamInterest(configuration, event);
  };
}

/**
 * Consumes the durable, shared buffer queue and appends events of interest to the replay buffer.
 *
 * The queue is acked only after the append, so the buffer is filled at least once; the buffer dedupes on event id.
 */
export function startBufferWriter(
  logger: Logger,
  queue: DomainEventSubscriberService,
  buffer: RedisEventBuffer,
  isOfInterest: BufferInterest,
): Subscription {
  return queue.getItems().subscribe(async ({ item, done }) => {
    try {
      if (item.tenantId && (await isOfInterest(item))) {
        const entryId = await buffer.append(item);
        logger.debug(`Buffered event ${item.namespace}:${item.name} (ID: ${item.id}) as entry ${entryId}.`, {
          ...LOG_CONTEXT,
          tenant: item.tenantId.toString(),
        });
      }
      done();
    } catch (err) {
      logger.error(`Error buffering event ${item.namespace}:${item.name} (ID: ${item.id}): ${err}`, {
        ...LOG_CONTEXT,
        tenant: item.tenantId?.toString(),
      });
      done(err);
    }
  });
}

const LOG_CONTEXT = { context: 'BufferWriter' };
