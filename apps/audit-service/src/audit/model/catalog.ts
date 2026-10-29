import { AdspId, AuditActionDefinition, ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Logger } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { ActionCatalog, AuditConfiguration } from '../configuration';
import { CatalogActionStore, CatalogApplicationSource } from './catalog-source';

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

export class ActionConflictError extends InvalidOperationError {
  constructor(message: string) {
    super(message, { statusCode: HttpStatusCodes.CONFLICT });
    Object.setPrototypeOf(this, ActionConflictError.prototype);
  }
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export class CatalogService {
  constructor(
    private readonly configuration: ConfigurationService,
    private readonly logger: Logger,
    private readonly source?: CatalogApplicationSource,
    private readonly store?: CatalogActionStore,
  ) {}

  /**
   * Adds an action to the tenant's catalog for the namespace. The name is compared, case-insensitively and in full,
   * with fresh configuration (not the SDK cache): the namespace's own catalog and every Core catalog. Core wins over
   * tenant actions, so a clash would make the tenant action unreachable.
   */
  async addAction(
    namespace: string,
    name: string,
    definition: AuditActionDefinition,
    tenantId: AdspId,
    token: string,
  ): Promise<void> {
    if (!this.source || !this.store) {
      throw new CatalogUnavailableError();
    }

    let existing: string[] | null;
    try {
      const coreApplications = await this.source.listApplications();
      if (coreApplications.includes(namespace)) {
        throw new ActionConflictError(`Namespace "${namespace}" is a Core namespace; its actions cannot be changed.`);
      }
      const coreCatalogs = await Promise.all(
        coreApplications.map(async (application) => ({
          application,
          names: (await this.store?.readActionNames(application)) ?? [],
        })),
      );
      const core = coreCatalogs.find(({ names }) => names.some((existingName) => sameName(existingName, name)));
      if (core) {
        throw new ActionConflictError(`Action "${name}" already exists in the ${core.application} Core namespace.`);
      }
      existing = await this.store.readActionNames(namespace, tenantId);
    } catch (err) {
      if (err instanceof ActionConflictError) throw err;
      this.logger.warn(`Unable to check action ${name} of ${namespace}: ${err}`, {
        context: 'AuditCatalog',
        tenant: tenantId.toString(),
      });
      throw new CatalogUnavailableError();
    }

    if (existing?.some((existingName) => sameName(existingName, name))) {
      throw new ActionConflictError(`Action "${name}" already exists in the ${namespace} catalog.`);
    }

    await this.store.saveAction(namespace, name, definition, token, !!existing);
    // The next read must see the new action rather than the cached catalog.
    this.configuration.clearCached?.(tenantId, 'audit-service', `actions-${namespace}`);
  }

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
