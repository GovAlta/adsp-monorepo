import { AdspId, ServiceDirectory, TokenProvider, ConfigurationService } from '@abgov/adsp-service-sdk';

import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { Webhooks } from '../model';

/**
 * Applications are stored in both the status-repository (for
 * dynamic, status data) and the configuration-service f(or
 * static information).
 */

export class WebhookRepo {
  #repository: ServiceStatusRepository;
  #endpointStatusEntryRepository: EndpointStatusEntryRepository;
  #serviceId: AdspId;
  #directoryService: ServiceDirectory;
  #tokenProvider: TokenProvider;
  #configurationService: ConfigurationService;
  constructor(
    repository: ServiceStatusRepository,
    endpointStatusEntryRepository: EndpointStatusEntryRepository,
    serviceId: AdspId,
    directoryService: ServiceDirectory,
    tokenProvider: TokenProvider,
    configurationService: ConfigurationService
  ) {
    this.#repository = repository;
    this.#serviceId = serviceId;
    this.#directoryService = directoryService;
    this.#tokenProvider = tokenProvider;
    this.#endpointStatusEntryRepository = endpointStatusEntryRepository;
    this.#configurationService = configurationService;
  }

  getWebhook = async (appKey: string, tenantId: AdspId): Promise<Webhooks> => {
    const webhook = await this.getWebhooks(tenantId);
    const key = Object.keys(webhook).find((hook) => {
      return webhook[hook].id === appKey;
    });
    return webhook[key];
  };

  getWebhooks = async (tenantId: AdspId): Promise<Record<string, Webhooks>> => {
    const token = await this.#tokenProvider.getAccessToken();
    const pushServiceId = AdspId.parse('urn:ads:platform:push-service');
    const response = await this.#configurationService.getConfiguration<
      Record<string, Webhooks>,
      Record<string, Webhooks>
    >(pushServiceId, token, tenantId);

    const webhooksRes = response?.webhooks;
    const webhooks = {} as Record<string, Webhooks>;
    Object.keys(webhooksRes).map(async (key) => {
      if (webhooksRes[key]) {
        webhooks[key] = { ...webhooksRes[key], tenantId: tenantId };
      }
    });
    return webhooks;
  };
}
