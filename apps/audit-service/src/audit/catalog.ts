import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Logger } from 'winston';
import { ActionCatalog, AuditConfiguration } from './configuration';

export class CatalogUnavailableError extends InvalidOperationError {
  constructor() {
    super('Action catalog is temporarily unavailable. Retry the request; do not re-register actions.', {
      statusCode: 503,
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
