import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
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

interface ConfigurationListPage {
  results?: { name: string }[];
  page?: { next?: string };
}

/**
 * Enumerates actions-<application> entries of the audit-service configuration namespace.
 * The SDK configuration service can only read a known name, so listing goes to the configuration service directly.
 */
export class ConfigurationCatalogSource implements CatalogApplicationSource {
  constructor(
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider,
  ) {}

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
