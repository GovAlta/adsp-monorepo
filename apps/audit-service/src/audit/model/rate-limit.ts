import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
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

  // Rate limiting protects availability, so unreadable or invalid settings fall back to the
  // deployment default rather than refusing every write.
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
      this.logger.warn(`Unable to resolve rate limit; using the platform default: ${err}`, {
        context: 'AuditRateLimit',
        tenant: tenantId.toString(),
      });
      return this.platformDefault;
    }
  }
}
