import { adspId, AdspId, AuditActionDefinition, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { AUDIT_SERVICE_NAMESPACE } from '../types';
import { APPLICATION_PATTERN } from '../configuration';

const CATALOG_PREFIX = 'actions-';
const PAGE_SIZE = 50;

export interface CatalogApplicationSource {
  /**
   * Lists the applications that have an action catalog registered in the core (no tenant) or the given tenant context.
   */
  listApplications(tenantId?: AdspId): Promise<string[]>;
}

export interface CatalogActionStore {
  /**
   * Reads the action names of a catalog straight from the configuration service, bypassing the SDK cache so that
   * recently added actions are visible. Returns null when the catalog does not exist.
   */
  readActionNames(application: string, tenantId?: AdspId): Promise<string[] | null>;
  /**
   * Writes one action into the tenant's catalog under the caller's token, so configuration permissions still apply.
   * Creates the catalog when it does not exist yet.
   */
  saveAction(
    application: string,
    name: string,
    definition: AuditActionDefinition,
    token: string,
    exists: boolean,
  ): Promise<void>;
}

interface ConfigurationListPage {
  results?: { name: string }[];
  page?: { next?: string };
}

/**
 * Enumerates actions-<application> entries of the audit-service configuration namespace.
 * The SDK configuration service can only read a known name, so listing goes to the configuration service directly.
 */
export class ConfigurationCatalogSource implements CatalogApplicationSource, CatalogActionStore {
  constructor(
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async readActionNames(application: string, tenantId?: AdspId): Promise<string[] | null> {
    const [baseUrl, token] = await Promise.all([
      this.directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`),
      this.tokenProvider.getAccessToken(),
    ]);
    const url = new URL(`v2/configuration/${AUDIT_SERVICE_NAMESPACE}/${CATALOG_PREFIX}${application}/latest`, baseUrl);
    try {
      const { data } = await axios.get<{ actions?: Record<string, unknown> } | null>(url.href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenantId?.toString() },
      });
      return data?.actions ? Object.keys(data.actions) : null;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async saveAction(
    application: string,
    name: string,
    definition: AuditActionDefinition,
    token: string,
    exists: boolean,
  ): Promise<void> {
    const baseUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
    const url = new URL(`v2/configuration/${AUDIT_SERVICE_NAMESPACE}/${CATALOG_PREFIX}${application}`, baseUrl);
    const catalog = { kind: 'actionCatalog', application, actions: { [name]: definition } };
    await axios.patch(
      url.href,
      exists ? { operation: 'UPDATE', update: catalog } : { operation: 'REPLACE', configuration: catalog },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  async listApplications(tenantId?: AdspId): Promise<string[]> {
    const [baseUrl, token] = await Promise.all([
      this.directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`),
      this.tokenProvider.getAccessToken(),
    ]);
    const url = new URL(`v2/configuration/${AUDIT_SERVICE_NAMESPACE}`, baseUrl).href;
    const pattern = new RegExp(APPLICATION_PATTERN);

    const applications: string[] = [];
    let after: string | undefined;
    do {
      const { data } = await axios.get<ConfigurationListPage>(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { top: PAGE_SIZE, after, tenantId: tenantId?.toString() },
      });
      for (const { name } of data.results || []) {
        const application = name.startsWith(CATALOG_PREFIX) ? name.substring(CATALOG_PREFIX.length) : null;
        if (application && pattern.test(application)) {
          applications.push(application);
        }
      }
      after = data.page?.next;
    } while (after);

    return applications;
  }
}
