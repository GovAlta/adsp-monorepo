import { AdspId, TokenProvider, ConfigurationService } from '@abgov/adsp-service-sdk';

import { Webhooks } from '../model';

/**
 * Webhooks are stored in the push-service configuration; this repo is a
 * read-only accessor for them and holds no status-service concerns.
 */

export class WebhookRepo {
  #tokenProvider: TokenProvider;
  #configurationService: ConfigurationService;
  constructor(tokenProvider: TokenProvider, configurationService: ConfigurationService) {
    this.#tokenProvider = tokenProvider;
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
