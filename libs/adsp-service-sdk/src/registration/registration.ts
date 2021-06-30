import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
import { Logger } from 'winston';
import { ServiceRegistrar, ServiceRegistration, ServiceRole } from './index';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { adspId } from '../utils';
import { DomainEventDefinition } from '../event';

interface EventServiceOptions {
  id: string;
  configOptions: Record<string, { name: string; definitions: Record<string, DomainEventDefinition> }>;
}

export class ServiceRegistrarImpl implements ServiceRegistrar {
  private readonly LOG_CONTEXT = { context: 'ServiceRegistration' };

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {}

  async register(registration: ServiceRegistration): Promise<void> {
    const configurationServiceId = adspId`urn:ads:platform:configuration-service:v1`;
    const serviceUrl = await this.directory.getServiceUrl(configurationServiceId);

    try {
      await retry(async (next, count) => {
        try {
          await this.#tryRegister(serviceUrl, count, registration);
        } catch (err) {
          this.logger.debug(`Try ${count} failed with error. ${err}`, this.LOG_CONTEXT);
          next(err);
        }
      });

      this.logger.info(`Registered service ${registration.serviceId}`, this.LOG_CONTEXT);
    } catch (err) {
      this.logger.error(`Error encountered registering service. ${err}`);
      throw err;
    }

    if (registration.events) {
      await this.#registerEvents(registration.serviceId.service, registration.events);
    }
  }

  #registerEvents = async (namespace: string, events: DomainEventDefinition[]): Promise<void> => {
    const configurationServiceId = adspId`urn:ads:platform:configuration-service:v1`;
    const serviceUrl = await this.directory.getServiceUrl(configurationServiceId);

    try {
      await retry(async (next, count) => {
        try {
          await this.#tryRegisterEvents(serviceUrl, count, namespace, events);
        } catch (err) {
          this.logger.debug(`Try ${count} failed with error. ${err}`, this.LOG_CONTEXT);
          next(err);
        }
      });

      this.logger.info(
        `Registered event definitions for namespace ${namespace}: ${events.map((e) => e.name).join(', ')}`,
        this.LOG_CONTEXT
      );
    } catch (err) {
      this.logger.error(`Error encountered registering events. ${err}`);
      throw err;
    }
  };

  #tryRegister = async (serviceUrl: URL, count: number, registration: ServiceRegistration): Promise<void> => {
    const { serviceId, displayName, description, roles, configurationSchema } = registration;
    const serviceRoles: ServiceRole[] =
      roles?.map((r) => (typeof r === 'string' ? { role: r, description: '' } : r)) || [];

    this.logger.debug(`Try ${count}: registering service ${serviceId}...`, this.LOG_CONTEXT);

    const registerUrl = new URL(`v1/serviceOptions/${serviceId.service}/v1`, serviceUrl);
    const token = await this.tokenProvider.getAccessToken();
    await axios.post(
      registerUrl.href,
      {
        service: serviceId.service,
        version: 'v1',
        displayName,
        description,
        roles: serviceRoles,
        configSchema: configurationSchema,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  #tryRegisterEvents = async (
    serviceUrl: URL,
    count: number,
    namespace: string,
    events: DomainEventDefinition[]
  ): Promise<void> => {
    this.logger.debug(`Try ${count}: registering event definitions for namespace ${namespace}...`, this.LOG_CONTEXT);

    const namespaceConfig = {
      name: namespace,
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
    const getOptionsUrl = new URL('v1/serviceOptions?service=event-service&top=1', serviceUrl);

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
        { service: 'event-service', version: 'v1', configOptions: { [namespace]: namespaceConfig } },
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
          service: 'event-service',
          version: 'v1',
          configOptions: { ...eventServiceOption.configOptions, [namespace]: namespaceConfig },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      this.logger.debug(`Updated event service service options.`, this.LOG_CONTEXT);
    }
  };
}
