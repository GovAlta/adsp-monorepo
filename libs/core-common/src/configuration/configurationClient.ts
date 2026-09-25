import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;

/**
 * Reads and writes one configuration document (namespace:name) in the configuration-service, with the calling
 * service's service account. Unlike the SDK configuration service, reads are not cached or converted, so services can
 * use this to manage their own configuration entries (e.g. definitions) behind routes that check user access.
 */
export class ConfigurationClient<C extends object = Record<string, unknown>> {
  constructor(
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    private namespace: string,
    private name: string,
  ) {}

  public async getTenantConfiguration(tenantId: AdspId): Promise<C> {
    return this.getConfiguration({ tenantId: tenantId.toString() });
  }

  public async getCoreConfiguration(): Promise<C> {
    return this.getConfiguration({ core: '' });
  }

  public async updateEntry<K extends keyof C & string>(tenantId: AdspId, key: K, value: C[K]): Promise<C> {
    return this.patchConfiguration(tenantId, { operation: 'UPDATE', update: { [key]: value } });
  }

  public async deleteEntry(tenantId: AdspId, key: keyof C & string): Promise<C> {
    return this.patchConfiguration(tenantId, { operation: 'DELETE', property: key });
  }

  private async getConfiguration(params: Record<string, string>): Promise<C> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.get<C>(`${url}/latest`, { headers, params });
    return data || ({} as C);
  }

  private async patchConfiguration(tenantId: AdspId, request: Record<string, unknown>): Promise<C> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.patch<{ latest?: { configuration?: C } }>(url, request, {
      headers,
      params: { tenantId: tenantId.toString() },
    });
    return data?.latest?.configuration || ({} as C);
  }

  private async getRequestContext(): Promise<{ url: string; headers: Record<string, string> }> {
    const configurationApiUrl = await this.directory.getServiceUrl(configurationApiId);
    const token = await this.tokenProvider.getAccessToken();
    return {
      url: new URL(`v2/configuration/${this.namespace}/${this.name}`, configurationApiUrl).href,
      headers: { Authorization: `Bearer ${token}` },
    };
  }
}
