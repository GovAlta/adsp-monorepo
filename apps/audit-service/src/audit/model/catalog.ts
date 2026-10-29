import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Logger } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { ActionCatalog, AuditConfiguration } from '../configuration';
import { CatalogApplicationSource } from './catalog-source';

export interface CatalogListing extends ActionCatalog {
  // True when a Core catalog is registered for the application; tenants cannot change those actions.
  core: boolean;
}

export class CatalogUnavailableError extends InvalidOperationError {
  constructor() {
    super('Action catalog is temporarily unavailable. Retry the request; do not re-register actions.', {
      statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
    });
    Object.setPrototypeOf(this, CatalogUnavailableError.prototype);
  }
}

export class CatalogService {
  constructor(
    private readonly configuration: ConfigurationService,
    private readonly logger: Logger,
    private readonly source?: CatalogApplicationSource,
  ) {}

  /**
   * Lists every catalog visible to the tenant: the tenant's own plus those registered by Core (for example the
   * platform services). Without a tenant, only Core catalogs are listed. Each catalog is resolved the same way as
   * getCatalog, so tenant and Core actions are merged with Core winning.
   */
  async listCatalogs(tenantId?: AdspId): Promise<CatalogListing[]> {
    if (!this.source) {
      throw new CatalogUnavailableError();
    }

    let coreApplications: string[];
    let tenantApplications: string[];
    try {
      [coreApplications, tenantApplications] = await Promise.all([
        this.source.listApplications(),
        tenantId ? this.source.listApplications(tenantId) : Promise.resolve([]),
      ]);
    } catch (err) {
      this.logger.warn(`Unable to list action catalogs: ${err}`, {
        context: 'AuditCatalog',
        tenant: tenantId?.toString(),
      });
      throw new CatalogUnavailableError();
    }

    const core = new Set(coreApplications);
    const applications = [...new Set([...coreApplications, ...tenantApplications])].sort();
    const catalogs = await Promise.all(
      applications.map(async (application) => {
        const catalog = await this.getCatalog(application, tenantId);
        return catalog ? { ...catalog, core: core.has(application) } : null;
      }),
    );
    return catalogs.filter((catalog): catalog is CatalogListing => !!catalog);
  }

  async getCatalog(namespace: string, tenantId?: AdspId): Promise<ActionCatalog | null> {
    try {
      const catalog = await this.configuration.getServiceConfiguration<AuditConfiguration, AuditConfiguration | null>(
        `actions-${namespace}`,
        tenantId,
      );
      if (!catalog) return null;
      if (catalog.kind !== 'actionCatalog' || catalog.application !== namespace) {
        throw new Error('Action catalog application does not match its configuration name.');
      }
      return catalog;
    } catch (err) {
      this.logger.warn(`Unable to resolve action catalog ${namespace}: ${err}`, {
        context: 'AuditCatalog',
        tenant: tenantId?.toString(),
      });
      throw new CatalogUnavailableError();
    }
  }
}
