import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;

export interface ConfigurationRevision<C> {
  revision: number;
  configuration: C;
}

/**
 * The latest revision and, only when one is pinned, the active revision of a configuration document. A document
 * that has never been written has neither.
 */
export interface ConfigurationDocument<C> {
  latest?: ConfigurationRevision<C>;
  active?: ConfigurationRevision<C>;
}

/**
 * Reads and writes one configuration document (namespace:name) in the configuration-service, with the calling
 * service's service account. Unlike the SDK configuration service, reads are not cached or converted, so services can
 * use this to manage their own configuration entries (e.g. definitions) behind routes that check user access.
 *
 * The entry methods (updateEntry, deleteEntry) change one key of an object document. The document methods
 * (getDocument, replaceConfiguration, setActiveRevision, deleteConfiguration) act on the document as a whole, for
 * documents that are not a map of entries, such as an array.
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

  // Unlike getTenantConfiguration, a missing document is not defaulted to {}, so callers can tell it apart from an
  // empty one.
  public async getDocument(tenantId: AdspId): Promise<ConfigurationDocument<C>> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.get<ConfigurationDocument<C>>(url, {
      headers,
      params: this.getTenantParams(tenantId),
    });
    return { latest: data?.latest, active: data?.active };
  }

  public async replaceConfiguration(tenantId: AdspId, configuration: C): Promise<ConfigurationRevision<C>> {
    return this.patchRevision(tenantId, { operation: 'REPLACE', configuration });
  }

  public async setActiveRevision(tenantId: AdspId, revision: number): Promise<void> {
    const { url, headers } = await this.getRequestContext();
    await axios.post(
      url,
      { operation: 'SET-ACTIVE-REVISION', revision },
      { headers, params: this.getTenantParams(tenantId) },
    );
  }

  public async deleteConfiguration(tenantId: AdspId): Promise<boolean> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.delete<{ deleted?: boolean }>(url, {
      headers,
      params: this.getTenantParams(tenantId),
    });
    return !!data?.deleted;
  }

  private async getConfiguration(params: Record<string, string>): Promise<C> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.get<C>(`${url}/latest`, { headers, params });
    return data || ({} as C);
  }

  private async patchConfiguration(tenantId: AdspId, request: Record<string, unknown>): Promise<C> {
    const latest = await this.patchRevision(tenantId, request);
    return latest?.configuration || ({} as C);
  }

  private async patchRevision(tenantId: AdspId, request: Record<string, unknown>): Promise<ConfigurationRevision<C>> {
    const { url, headers } = await this.getRequestContext();
    const { data } = await axios.patch<{ latest?: ConfigurationRevision<C> }>(url, request, {
      headers,
      params: this.getTenantParams(tenantId),
    });
    return data?.latest;
  }

  private getTenantParams(tenantId: AdspId): Record<string, string> {
    return { tenantId: tenantId.toString() };
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
