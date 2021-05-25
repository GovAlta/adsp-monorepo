import axios from 'axios';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
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

export interface TenantService {
  getTenants(): Promise<Tenant[]>;
  getTenant(tenantId: AdspId): Promise<Tenant>;
}

export class TenantServiceImpl implements TenantService {
  private readonly LOG_CONTEXT = { context: 'TenantService' };

  #tenants = new NodeCache({
    stdTTL: 36000,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {
    // load into the cache.
    this.#retrieveTenants().catch((err) => logger.error(`Encountered error during initialization of tenants. ${err}`));
  }

  #retrieveTenants = async (): Promise<Tenant[]> => {
    this.logger.debug(`Retrieving tenants...'`, this.LOG_CONTEXT);

    const tenantServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:tenant-service:v2`);
    const tenantsUrl = new URL('v2/tenants', tenantServiceUrl);

    this.logger.debug(`Requesting tenants from ${tenantsUrl}...'`, this.LOG_CONTEXT);

    const token = await this.tokenProvider.getAccessToken();

    try {
      const { data } = await axios.get<TenantsResponse>(tenantsUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const tenants = data?.results?.map((r) => ({
        id: AdspId.parse(r.id),
        name: r.name,
        realm: r.realm,
      }));

      if (tenants) {
        tenants.forEach((t) => {
          const key = `${t.id}`;
          this.#tenants.set(key, t);
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
    const tenantUrl = new URL(tenantId.resource, tenantServiceUrl);

    this.logger.debug(`Requesting tenant '${tenantId}' from ${tenantUrl}...'`, this.LOG_CONTEXT);

    const token = await this.tokenProvider.getAccessToken();

    try {
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
}
