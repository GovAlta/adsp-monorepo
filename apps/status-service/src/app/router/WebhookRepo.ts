import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';

import axios from 'axios';

import { StatusServiceConfiguration } from '../model';

import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';

import { Webhooks } from '../jobs/checkEndpoint';

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

  constructor(
    repository: ServiceStatusRepository,
    endpointStatusEntryRepository: EndpointStatusEntryRepository,
    serviceId: AdspId,
    directoryService: ServiceDirectory,
    tokenProvider: TokenProvider
  ) {
    this.#repository = repository;
    this.#serviceId = serviceId;
    this.#directoryService = directoryService;
    this.#tokenProvider = tokenProvider;
    this.#endpointStatusEntryRepository = endpointStatusEntryRepository;
  }

  getWebhook = async (appKey: string, tenantId: AdspId): Promise<Webhooks> => {
    const webhook = await this.getWebhooks(tenantId);
    const key = Object.keys(webhook).find((hook) => webhook[hook].id === appKey);
    return webhook[key];
  };

  getWebhooks = async (tenantId: AdspId): Promise<Record<string, Webhooks>> => {
    const baseUrl = await this.#directoryService.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
    const configUrl = new URL(
      `/configuration/v2/configuration/${this.#serviceId.namespace}/push-service/latest?tenantId=${tenantId}`,
      baseUrl
    );
    const token = await this.#tokenProvider.getAccessToken();
    const { data } = await axios.get<StatusServiceConfiguration>(configUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const keys = Object.keys(data);
    const webhooks = {};
    // Add the tenantId in, cause its not part of the configuration.
    keys.forEach((k) => {
      webhooks[k] = { ...data[k], tenantId: tenantId };
    });
    return webhooks;
  };
}
