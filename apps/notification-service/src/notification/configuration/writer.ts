import { adspId, AdspId, ConfigurationService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;

/**
 * Saves changes to the tenant's notification service configuration through the configuration service, using the
 * service account. Only the changed keys are sent, so other types and settings in the document are left untouched.
 */
export class NotificationConfigurationWriter {
  constructor(
    private serviceId: AdspId,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    private configurationService: ConfigurationService,
  ) {}

  async update(tenantId: AdspId, update: Record<string, unknown>): Promise<void> {
    await this.patch(tenantId, { operation: 'UPDATE', update });
  }

  async delete(tenantId: AdspId, property: string): Promise<void> {
    await this.patch(tenantId, { operation: 'DELETE', property });
  }

  private async patch(tenantId: AdspId, request: Record<string, unknown>): Promise<void> {
    const { namespace, service } = this.serviceId;
    const configurationApiUrl = await this.directory.getServiceUrl(configurationApiId);
    const token = await this.tokenProvider.getAccessToken();

    try {
      await axios.patch(new URL(`v2/configuration/${namespace}/${service}`, configurationApiUrl).href, request, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenantId.toString() },
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === HttpStatusCodes.BAD_REQUEST) {
        throw new InvalidOperationError(
          err.response.data?.errorMessage || 'Configuration service rejected the change.',
        );
      }
      throw err;
    }

    // Other instances clear their cache on the configuration updated event; clear this one now so the change is
    // returned by the next read.
    this.configurationService.clearCached?.(tenantId, namespace, service);
  }
}
