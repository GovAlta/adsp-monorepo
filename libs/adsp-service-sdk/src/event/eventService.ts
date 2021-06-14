import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { AdspId, adspId } from '../utils';
import type { DomainEvent, DomainEventDefinition } from './event';

export interface EventService {
  send(event: DomainEvent): void;
}

interface EventServiceOptions {
  id: string;
  configOptions: Record<string, { name: string; definitions: Record<string, DomainEventDefinition> }>;
}

export class EventServiceImpl implements EventService {
  private readonly LOG_CONTEXT = { context: 'EventService' };

  private readonly namespace: string;
  private readonly definitions: string[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider,
    serviceId: AdspId
  ) {
    this.namespace = serviceId.service;
  }

  #tryRegister = async (serviceUrl: URL, count: number, events: DomainEventDefinition[]): Promise<void> => {
    this.logger.debug(
      `Try ${count}: registering event definitions for namespace ${this.namespace}...`,
      this.LOG_CONTEXT
    );

    const namespaceConfig = {
      name: this.namespace,
      definitions: events.reduce(
        (defs, def) => ({
          ...defs,
          [def.name]: {
            name: def.name,
            description: def.description,
            payloadSchema: def.payloadSchema,
          },
        }),
        {}
      ),
    };
    const getOptionsUrl = new URL('v1/serviceOptions?service=eventService&top=1', serviceUrl);

    let token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.get<{ results: EventServiceOptions[] }>(getOptionsUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    token = await this.tokenProvider.getAccessToken();
    const eventServiceOption = data.results[0];
    if (!eventServiceOption) {
      this.logger.debug(`Creating event service service options...`, this.LOG_CONTEXT);

      const createUrl = new URL('v1/serviceOptions', serviceUrl);
      await axios.post(
        createUrl.href,
        { service: 'eventService', version: 'v1', configOptions: { [this.namespace]: namespaceConfig } },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      this.logger.debug(`Created event service service options.`, this.LOG_CONTEXT);
    } else {
      this.logger.debug(`Updating event service service options...`, this.LOG_CONTEXT);

      const updateUrl = new URL(`v1/serviceOptions/${eventServiceOption.id}`, serviceUrl);
      await axios.put(
        updateUrl.href,
        {
          ...eventServiceOption,
          service: 'eventService',
          version: 'v1',
          configOptions: { ...eventServiceOption.configOptions, [this.namespace]: namespaceConfig },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      this.logger.debug(`Updated event service service options.`, this.LOG_CONTEXT);
    }
  };

  async register(skipPublish: boolean, ...events: DomainEventDefinition[]): Promise<void> {
    const configurationServiceId = adspId`urn:ads:platform:configuration-service:v1`;
    const serviceUrl = await this.directory.getServiceUrl(configurationServiceId);

    try {
      if (!skipPublish) {
        await retry(async (next, count) => {
          try {
            await this.#tryRegister(serviceUrl, count, events);
          } catch (err) {
            this.logger.debug(`Try ${count} failed with error. ${err}`, this.LOG_CONTEXT);
            next(err);
          }
        });
      } else {
        this.logger.info('Skipping publish of event definitions.');
      }

      this.definitions.push(...events.map((e) => e.name));

      this.logger.info(
        `Registered event definitions for namespace ${this.namespace}: ${events.map((e) => e.name).join(', ')}`,
        this.LOG_CONTEXT
      );
    } catch (err) {
      this.logger.error(`Error encountered registering events. ${err}`);
      throw err;
    }
  }

  async send(event: DomainEvent): Promise<void> {
    if (!this.definitions.includes(event.name)) {
      throw new Error(`Event ${this.namespace}:${event.name} is not recognized; only registered events can be sent.`);
    }

    const serviceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:event-service:v1`);
    const sendUrl = new URL('v1/events', serviceUrl);

    try {
      const token = await this.tokenProvider.getAccessToken();

      this.logger.debug(`Sending event ${this.namespace}:${event.name} to: ${sendUrl}...`);
      await axios.post(
        sendUrl.href,
        { ...event, namespace: this.namespace, tenantId: event.tenantId ? `${event.tenantId}` : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      this.logger.info(`Sent domain event ${this.namespace}:${event.name}.`, this.LOG_CONTEXT);
    } catch (err) {
      this.logger.error(`Error encountered on sending of event ${this.namespace}:${event.name}. ${err}`);
    }
  }
}
