import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { createLogger, transports } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { calculateRetentionUntil, DEFAULT_RETENTION_CLASSES, RetentionService } from './retention';

describe('write-time retention', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const retention = new RetentionService(configuration, logger);

  beforeEach(() => {
    jest.resetAllMocks();
    configuration.getServiceConfiguration.mockResolvedValue(null);
  });

  it('uses the original design periods when no overrides are configured', async () => {
    expect(await retention.getClasses('case-service', tenantId)).toEqual({
      standard: { days: 90 },
      security: { days: 365 },
      compliance: { days: 365 },
    });
  });

  it('resolves named retention documents for the target tenant', async () => {
    await retention.getClasses('case-service', tenantId);

    expect(configuration.getServiceConfiguration.mock.calls).toEqual([
      ['retention', tenantId],
      ['retention-case-service', tenantId],
    ]);
  });

  it('applies application periods over general settings without discarding other classes', async () => {
    configuration.getServiceConfiguration
      .mockResolvedValueOnce({
        kind: 'retentionSettings',
        classes: { standard: { days: 120 }, 'case-history': { days: 730 } },
      })
      .mockResolvedValueOnce({
        kind: 'applicationRetentionSettings',
        application: 'case-service',
        classes: { standard: { days: 180 } },
      });

    expect(await retention.getClasses('case-service', tenantId)).toEqual({
      ...DEFAULT_RETENTION_CLASSES,
      standard: { days: 180 },
      'case-history': { days: 730 },
    });
    expect(DEFAULT_RETENTION_CLASSES.standard.days).toBe(90);
  });

  it('returns 503 when a retention configuration error propagates from the SDK', async () => {
    configuration.getServiceConfiguration.mockRejectedValue(new Error('Configuration unavailable'));

    await expect(retention.getClasses('case-service', tenantId)).rejects.toMatchObject({
      extra: { statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE },
    });
  });

  it.each([
    [{ kind: 'actionCatalog', application: 'case-service', actions: {} }, null],
    [null, { kind: 'retentionSettings', classes: {} }],
    [null, { kind: 'applicationRetentionSettings', application: 'payment-service', classes: {} }],
  ])('refuses mismatched configuration documents %#', async (settings, application) => {
    configuration.getServiceConfiguration.mockResolvedValueOnce(settings).mockResolvedValueOnce(application);

    await expect(retention.getClasses('case-service', tenantId)).rejects.toMatchObject({
      extra: { statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE },
    });
  });

  it.each([
    ['standard', 90],
    ['security', 365],
    ['compliance', 365],
  ] as const)('calculates %s from occurrence time using UTC day durations', (retentionClass, days) => {
    const occurredAt = new Date('2026-10-15T12:00:00-06:00');

    expect(calculateRetentionUntil(occurredAt, retentionClass, DEFAULT_RETENTION_CLASSES).getTime()).toBe(
      occurredAt.getTime() + days * 86400000,
    );
  });

  it.each([{}, { custom: { days: 0 } }, { custom: { days: 1.5 } }, { custom: { days: Number.MAX_SAFE_INTEGER } }])(
    'refuses missing or unusable custom periods %#',
    (classes) => {
      expect(() => calculateRetentionUntil(new Date('2026-10-15'), 'custom', classes)).toThrow(
        expect.objectContaining({ extra: { statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE } }),
      );
    },
  );

  it('does not use inherited properties as retention classes', () => {
    expect(() => calculateRetentionUntil(new Date('2026-10-15'), 'constructor', DEFAULT_RETENTION_CLASSES)).toThrow(
      'no valid write-time period',
    );
  });

  it('fixes a date independently of later configuration updates', () => {
    const classes = { custom: { days: 30 } };
    const until = calculateRetentionUntil(new Date('2026-10-01T00:00:00Z'), 'custom', classes);

    classes.custom.days = 60;

    expect(until.toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });
});
