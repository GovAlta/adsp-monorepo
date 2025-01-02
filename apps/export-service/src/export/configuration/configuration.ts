import { adspId, AdspId } from '@abgov/adsp-service-sdk';

export interface ExportSource {
  exporterRoles: string[];
}

export interface ConfigurationValue {
  sources: Record<string, ExportSource>;
}

export class ExportServiceConfiguration {
  private sources: Record<string, ExportSource>;
  constructor(configuration: ConfigurationValue, public tenantId: AdspId) {
    this.sources = configuration.sources;
  }

  getSource(resourceId: AdspId): ExportSource {
    let source: ExportSource;
    if (resourceId.type === 'resource') {
      const apiId = adspId`urn:ads:${resourceId.namespace}:${resourceId.service}:${resourceId.api}`;
      const serviceId = adspId`urn:ads:${resourceId.namespace}:${resourceId.service}`;

      source = this.sources[apiId.toString()] || this.sources[serviceId.toString()];
    }

    return source;
  }
}
