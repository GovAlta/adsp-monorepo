import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import type { Tenant, TenantService } from '../tenant';

export class IssuerCache {
  private readonly LOG_CONTEXT = { context: 'IssuerCache' };

  #issuers = new NodeCache({
    stdTTL: 3600,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly accessServiceUrl: URL,
    private readonly service: TenantService
  ) {}

  #getIssuer = (tenant: Tenant): string => {
    if (!tenant || !tenant.realm) {
      return null;
    }

    const tenantIssuerUrl = new URL(`/auth/realms/${tenant.realm}`, this.accessServiceUrl);
    return tenantIssuerUrl.href;
  };

  #updateIssuers = async (): Promise<void> => {
    this.logger.debug(`Updating issuers...'`, this.LOG_CONTEXT);

    const tenants = await this.service.getTenants();
    if (tenants) {
      tenants.forEach((t) => {
        const iss = this.#getIssuer(t);
        if (iss) {
          this.#issuers.set(iss, t);
          this.logger.debug(`Caching issuer '${iss}' for tenant '${t.id}'`, this.LOG_CONTEXT);
        }
      });
      this.logger.info(`Updated issuers.`, this.LOG_CONTEXT);
    } else {
      this.logger.warn(`No tenants found during update of issuers.`, this.LOG_CONTEXT);
    }
  };

  getTenantByIssuer = async (issuer: string): Promise<Tenant> => {
    let tenant = this.#issuers.get<Tenant>(issuer);
    if (!tenant) {
      try
      {
        await this.#updateIssuers();
        tenant = this.#issuers.get<Tenant>(issuer);
      }
      catch (err) {
        this.logger.error(`Encountered error on updating issuers. ${err}`);
      }
    }

    return tenant;
  };
}
