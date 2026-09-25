import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import type { Namespace } from './types';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;
const VALUE_CONFIGURATION_PATH = 'v2/configuration/platform/value-service';

export type ValueConfiguration = Record<string, Namespace>;

/**
 * Reads and writes value definitions in the value-service configuration document. The configuration-service is the
 * storage for definitions; calls are made with the value-service service account, and user access is checked by the
 * value-service definition routes.
 */
export class DefinitionConfigurationClient {
  constructor(
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
  ) {}

  public async getTenantConfiguration(tenantId: AdspId): Promise<ValueConfiguration> {
    return this.getConfiguration({ tenantId: tenantId.toString() });
  }

  public async getCoreConfiguration(): Promise<ValueConfiguration> {
    return this.getConfiguration({ core: '' });
  }

  public async updateNamespace(tenantId: AdspId, namespace: Namespace): Promise<ValueConfiguration> {
    return this.patchConfiguration(tenantId, { operation: 'UPDATE', update: { [namespace.name]: namespace } });
  }

  public async deleteNamespace(tenantId: AdspId, namespace: string): Promise<ValueConfiguration> {
    return this.patchConfiguration(tenantId, { operation: 'DELETE', property: namespace });
  }

  private async getConfiguration(params: Record<string, string>): Promise<ValueConfiguration> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.get<ValueConfiguration>(`${url}/latest`, { headers, params });
    return data || {};
  }

  private async patchConfiguration(tenantId: AdspId, request: Record<string, unknown>): Promise<ValueConfiguration> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.patch<{ latest?: { configuration?: ValueConfiguration } }>(url, request, {
      headers,
      params: { tenantId: tenantId.toString() },
    });
    return data?.latest?.configuration || {};
  }

  private async getRequestContext(): Promise<{ url: string; headers: Record<string, string> }> {
    const configurationApiUrl = await this.directory.getServiceUrl(configurationApiId);
    const token = await this.tokenProvider.getAccessToken();
    return {
      url: new URL(VALUE_CONFIGURATION_PATH, configurationApiUrl).href,
      headers: { Authorization: `Bearer ${token}` },
    };
  }
}
