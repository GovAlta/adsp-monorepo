import axios from 'axios';
import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { AdspId, adspId } from '../utils';
import type { DomainEvent, DomainEventDefinition } from './event';

/**
 * Interface to the event service for sending domain events.
 *
 * @export
 * @interface EventService
 */
export interface EventService {
  /**
   * Sends a domain event of the service.
   *
   * Domain event sent uses the service name as its namespace.
   *
   * @param {DomainEvent} event
   * @memberof EventService
   */
  send(event: DomainEvent): void;
}

export class EventServiceImpl implements EventService {
  private readonly LOG_CONTEXT = { context: 'EventService' };

  private readonly namespace: string;
  private readonly definitions: string[];

  constructor(
    private readonly isCore: boolean,
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider,
    serviceId: AdspId,
    events: DomainEventDefinition[]
  ) {
    this.namespace = serviceId.service;
    this.definitions = events?.map((e) => e.name) || [];
  }

  async send({ tenantId, ...event }: DomainEvent): Promise<void> {
    if (!this.definitions.includes(event.name)) {
      throw new Error(`Event ${this.namespace}:${event.name} is not recognized; only registered events can be sent.`);
    }

    const serviceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:event-service:v1`);
    const sendUrl = new URL('v1/events', serviceUrl);

    try {
      const token = await this.tokenProvider.getAccessToken();

      this.logger.debug(`Sending event ${this.namespace}:${event.name} to: ${sendUrl}...`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });

      await axios.post(
        sendUrl.href,
        this.isCore
          ? { ...event, namespace: this.namespace, tenantId: `${tenantId}` }
          : { ...event, namespace: this.namespace },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      this.logger.info(`Sent domain event ${this.namespace}:${event.name}.`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    } catch (err) {
      this.logger.error(`Error encountered on sending of event ${this.namespace}:${event.name}. ${err}`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }
}
