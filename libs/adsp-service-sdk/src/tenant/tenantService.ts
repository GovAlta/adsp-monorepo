import axios from 'axios';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
import type { TokenProvider } from '../access';
import type { ServiceDirectory } from '../directory';
import { AdspId, adspId, assertAdspId } from '../utils';

export interface Tenant {
  id: AdspId;
  name: string;
  realm: string;
}

interface TenantResponse {
  id: string;
  name: string;
  realm: string;
}

interface TenantsResponse {
  results: TenantResponse[];
}

/**
 * Interface to tenant service for retrieve tenant information.
 *
 * @export
 * @interface TenantService
 */
export interface TenantService {
  getTenants(): Promise<Tenant[]>;
  getTenant(tenantId: AdspId): Promise<Tenant>;
  getTenantByName(name: string): Promise<Tenant>;
  getTenantByRealm(realm: string): Promise<Tenant>;
}

export class TenantServiceImpl implements TenantService {
  private readonly LOG_CONTEXT = { context: 'TenantService' };

  #tenants = new NodeCache({
    stdTTL: 36000,
    useClones: false,
  });

  #tenantNames: Record<string, AdspId> = {};
  #tenantRealms: Record<string, AdspId> = {};

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {
    // load into the cache.
    this.#retrieveTenants().catch((err) => logger.error(`Encountered error during initialization of tenants. ${err}`));
  }

  #tryRetrieveTenants = async (requestUrl: URL, count: number): Promise<Tenant[]> => {
    this.logger.debug(`Try ${count}: retrieving tenants from ${requestUrl}...'`, this.LOG_CONTEXT);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.get<TenantsResponse>(requestUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tenants = data?.results?.map((r) => ({
      id: AdspId.parse(r.id),
      name: r.name,
      realm: r.realm,
    }));

    return tenants;
  };

  #retrieveTenants = async (): Promise<Tenant[]> => {
    const tenantServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:tenant-service:v2`);
    const tenantsUrl = new URL('v2/tenants', tenantServiceUrl);

    try {
      const tenants: Tenant[] = await retry(async (next, count) => {
        try {
          return await this.#tryRetrieveTenants(tenantsUrl, count);
        } catch (err) {
          this.logger.debug(`Try ${count} failed with error. ${err}`, this.LOG_CONTEXT);
          next(err);
        }
      });

      if (tenants) {
        tenants.forEach((t) => {
          const key = `${t.id}`;
          this.#tenants.set(key, t);
          this.#tenantNames[t.name.toLowerCase()] = t.id;
          this.#tenantRealms[t.realm.toLowerCase()] = t.id;
          this.logger.debug(`Cached tenant '${key}' -> ${t.name} (${t.realm})`, this.LOG_CONTEXT);
        });
      }

      this.logger.info(`Retrieved and cached tenant information.`, this.LOG_CONTEXT);

      return tenants;
    } catch (err) {
      this.logger.error(`Error encountered during retrieval of tenants. ${err}`, this.LOG_CONTEXT);
      throw err;
    }
  };

  #retrieveTenant = async (tenantId: AdspId): Promise<Tenant> => {
    this.logger.debug(`Retrieving tenant information...'`, this.LOG_CONTEXT);

    const tenantServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:tenant-service:v2`);
    // Need the v2 prefix for a relative url of the form v2/tenants/... so the url resolves properly
    const tenantUrl = new URL(`v2${tenantId.resource}`, tenantServiceUrl);

    this.logger.debug(`Requesting tenant '${tenantId}' from ${tenantUrl}...'`, this.LOG_CONTEXT);

    try {
      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.get<TenantResponse>(tenantUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const tenant = data
        ? {
            ...data,
            id: AdspId.parse(data.id),
          }
        : null;

      if (tenant) {
        this.#tenants.set(`${tenant.id}`, tenant);
        this.#tenantNames[tenant.name.toLowerCase()] = tenant.id;
        this.logger.debug(`Cached tenant '${tenant.id}' -> ${tenant.name} (${tenant.realm})`, this.LOG_CONTEXT);
      }

      this.logger.debug(`Retrieved and cached tenant '${tenantId}'.`, this.LOG_CONTEXT);

      return tenant;
    } catch (err) {
      this.logger.error(`Error encountered during retrieval of tenant '${tenantId}'. ${err}`, this.LOG_CONTEXT);
      throw err;
    }
  };

  getTenants = async (): Promise<Tenant[]> => {
    const tenants = await this.#retrieveTenants();
    return tenants;
  };

  getTenant = async (tenantId: AdspId): Promise<Tenant> => {
    assertAdspId(tenantId, `Provided ID does not represent a resource: ${tenantId}.`, 'resource');

    const cacheKey = `${tenantId}`;
    const tenant = this.#tenants.get<Tenant>(cacheKey) || (await this.#retrieveTenant(tenantId));

    return tenant;
  };

  getTenantByName = async (name: string): Promise<Tenant> => {
    const tenantId = name && this.#tenantNames[name.toLowerCase()];

    return tenantId ? this.getTenant(tenantId) : null;
  };

  getTenantByRealm = async (realm: string): Promise<Tenant> => {
    const tenantId = realm && this.#tenantRealms[realm.toLowerCase()];

    return tenantId ? this.getTenant(tenantId) : null;
  };
}
