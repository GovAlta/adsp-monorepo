import axios from 'axios';
import { createLogger, transports } from 'winston';
import type { AuditAction } from '../audit';
import { createServiceRegistrar } from '../registration';
import { adspId } from '../utils';
import { initializePlatform, initializeService } from './index';

jest.mock('axios');
jest.mock('../access', () => ({
  createTokenProvider: () => ({ getAccessToken: async () => 'service-token' }),
  createRealmStrategy: jest.fn(),
  createTenantStrategy: jest.fn(),
}));
jest.mock('../directory', () => ({
  createDirectory: () => ({
    getResourceUrl: async () => new URL('https://audit.example.test/audit/v1/case-service/events'),
  }),
}));
jest.mock('../configuration', () => ({
  createConfigurationService: () => ({ clearCached: jest.fn() }),
  createConfigurationHandler: jest.fn(),
}));
jest.mock('../configuration/configurationHandler', () => ({ createTenantConfigurationHandler: jest.fn() }));
jest.mock('../event', () => ({ createEventService: jest.fn() }));
jest.mock('../healthCheck', () => ({ createHealthCheck: jest.fn() }));
jest.mock('../metrics', () => ({ createMetricsHandler: jest.fn() }));
jest.mock('../registration', () => ({
  createServiceRegistrar: jest.fn(() => ({ register: jest.fn().mockResolvedValue(undefined) })),
}));
jest.mock('../tenant', () => ({
  createTenantService: () => ({ getTenants: async () => [] }),
  createTenantHandler: jest.fn(),
}));
jest.mock('../trace', () => ({ createTraceHandler: jest.fn() }));

describe.each([
  { name: 'initializePlatform', initialize: initializePlatform },
  { name: 'initializeService', initialize: initializeService },
])('$name audit delivery', ({ initialize }) => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const options = {
    serviceId: adspId`urn:ads:platform:case-service`,
    displayName: 'Case service',
    description: 'Case management',
    realm: 'case-team',
    clientSecret: 'test-secret',
    directoryUrl: new URL('https://directory.example.test'),
    accessServiceUrl: new URL('https://access.example.test'),
  };
  const action: AuditAction = {
    name: 'case.update',
    version: 1,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'compliance',
  };
  const details = {
    actor: { id: 'user-1', type: 'user' as const },
    tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
  };
  const post = jest.mocked(axios.post);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    post.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a client that sends individual events without waiting for a timer', async () => {
    post.mockResolvedValue({ data: { accepted: 1, duplicates: 0, rejected: [] } });
    const { auditService } = await initialize({ ...options, auditActions: [action] }, { logger });

    await expect(auditService.record(action, details)).resolves.toMatchObject({ status: 'recorded' });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://audit.example.test/audit/v1/case-service/events',
      { events: [expect.objectContaining({ action: 'case.update' })] },
      expect.any(Object),
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it('passes explicit batch and request options to the audit client', async () => {
    post.mockResolvedValue({ data: { accepted: 2, duplicates: 0, rejected: [] } });
    const { auditService } = await initialize(
      { ...options, audit: { batchSize: 10, batchIntervalMs: 25, requestTimeoutMs: 750 } },
      { logger },
    );

    const outcomes = Promise.all([auditService.record(action, details), auditService.record(action, details)]);
    await jest.advanceTimersByTimeAsync(24);
    expect(post).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);

    await expect(outcomes).resolves.toEqual([
      expect.objectContaining({ status: 'recorded' }),
      expect.objectContaining({ status: 'recorded' }),
    ]);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://audit.example.test/audit/v1/case-service/events',
      { events: [expect.any(Object), expect.any(Object)] },
      expect.objectContaining({ timeout: 750 }),
    );
  });

  it('keeps audit client options out of service registration', async () => {
    await initialize({ ...options, audit: { batchSize: 100 } }, { logger });

    const registrar = jest.mocked(createServiceRegistrar).mock.results[0].value;
    expect(registrar.register).toHaveBeenCalledWith(expect.not.objectContaining({ audit: expect.anything() }));
  });
});
