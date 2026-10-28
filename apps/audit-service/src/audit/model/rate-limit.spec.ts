import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { createLogger, transports } from 'winston';
import { RateLimitSettings } from '../configuration';
import { RATE_LIMIT_CONFIGURATION_NAME, RateLimitService } from './rate-limit';

describe('RateLimitService', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`;
  const platformDefault = { eventsPerSecond: 500, burst: 500 };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  let service: RateLimitService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new RateLimitService(configuration, logger, platformDefault);
  });

  it('uses the platform default when no Core settings exist', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    await expect(service.getLimit(tenantA)).resolves.toEqual(platformDefault);
  });

  it('reads only the Core rate limit document, never a tenant-scoped one', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    await service.getLimit(tenantA);

    expect(configuration.getServiceConfiguration.mock.calls).toEqual([[RATE_LIMIT_CONFIGURATION_NAME]]);
  });

  it('applies a tenant override where configured and the Core default elsewhere', async () => {
    const settings: RateLimitSettings = {
      kind: 'rateLimitSettings',
      default: { eventsPerSecond: 800, burst: 600 },
      tenants: { [tenantA.toString()]: { eventsPerSecond: 2000, burst: 1000 } },
    };
    configuration.getServiceConfiguration.mockResolvedValue(settings);

    await expect(service.getLimit(tenantA)).resolves.toEqual({ eventsPerSecond: 2000, burst: 1000 });
    await expect(service.getLimit(tenantB)).resolves.toEqual({ eventsPerSecond: 800, burst: 600 });
  });

  it('falls back to the platform default when Core settings have only other tenants', async () => {
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'rateLimitSettings',
      tenants: { [tenantA.toString()]: { eventsPerSecond: 2000, burst: 1000 } },
    });

    await expect(service.getLimit(tenantB)).resolves.toEqual(platformDefault);
  });

  it.each([
    [
      'an unavailable configuration service',
      () => configuration.getServiceConfiguration.mockRejectedValue(new Error('offline')),
    ],
    [
      'a document of another kind',
      () => configuration.getServiceConfiguration.mockResolvedValue({ kind: 'retentionSettings', classes: {} }),
    ],
    [
      'an out-of-range limit',
      () =>
        configuration.getServiceConfiguration.mockResolvedValue({
          kind: 'rateLimitSettings',
          default: { eventsPerSecond: 500, burst: 100 },
        }),
    ],
  ])('keeps accepting writes at the platform default with %s', async (_, arrange) => {
    arrange();

    await expect(service.getLimit(tenantA)).resolves.toEqual(platformDefault);
  });

  it.each([
    { eventsPerSecond: 0, burst: 500 },
    { eventsPerSecond: 500, burst: 499 },
    { eventsPerSecond: 500, burst: 1001 },
    { eventsPerSecond: NaN, burst: 500 },
  ])('refuses an invalid platform default %p at startup', (limit) => {
    expect(() => new RateLimitService(configuration, logger, limit)).toThrow('Rate limit must be');
  });
});
