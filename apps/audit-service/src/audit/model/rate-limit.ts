import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import type { Logger } from 'winston';
import { assertRateLimit, AuditConfiguration, isValidRateLimit, RateLimit } from '../configuration';

export const RATE_LIMIT_CONFIGURATION_NAME = 'rate-limit';

export class RateLimitService {
  constructor(
    private readonly configuration: ConfigurationService,
    private readonly logger: Logger,
    private readonly platformDefault: RateLimit,
  ) {
    assertRateLimit(platformDefault);
  }

  async getLimit(tenantId: AdspId): Promise<RateLimit> {
    try {
      // Read Core only: tenant-scoped documents cannot override platform limits.
      const settings = await this.configuration.getServiceConfiguration<AuditConfiguration, AuditConfiguration | null>(
        RATE_LIMIT_CONFIGURATION_NAME,
      );
      if (!settings) return this.platformDefault;
      if (settings.kind !== 'rateLimitSettings') {
        throw new Error('Expected rateLimitSettings in the rate-limit configuration.');
      }
      const tenant = settings.tenants?.[tenantId.toString()];
      const limit = tenant ?? settings.default;
      if (!limit) return this.platformDefault;
      if (!isValidRateLimit(limit)) throw new Error('Configured rate limit is out of range.');
      return limit;
    } catch (err) {
      this.logger.warn(`Unable to resolve audit write rate limit: ${err}`, {
        context: 'AuditRateLimit',
        tenant: tenantId.toString(),
      });
      throw new InvalidOperationError('Audit write rate limit settings are temporarily unavailable.', {
        statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
      });
    }
  }
}
