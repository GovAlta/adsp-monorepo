import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Logger } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { ActionCatalog, AuditConfiguration } from '../configuration';
import { AUDIT_SERVICE_CATALOG, AUDIT_SERVICE_NAMESPACE } from './self-audit-catalog';

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
  ) {}

  async getCatalog(namespace: string, tenantId?: AdspId): Promise<ActionCatalog | null> {
    // The service's own namespace is built in, so it applies to every tenant without per-tenant registration.
    if (namespace === AUDIT_SERVICE_NAMESPACE) return AUDIT_SERVICE_CATALOG;

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
