import axios from 'axios';
import { createLogger, transports } from 'winston';
import { adspId } from '../utils';
import { ConfigurationServiceImpl } from './configurationService';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;

describe('configuration retrieval with the existing SDK cache', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const directory = {
    getServiceUrl: jest.fn(async () => new URL('https://configuration.example.test/configuration/v2')),
    getResourceUrl: jest.fn(),
  };
  const tokenProvider = { getAccessToken: jest.fn(async () => 'test-token') };
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`;
  const serviceId = adspId`urn:ads:platform:audit-service`;
  const createService = (converter = (value: unknown) => value) =>
    new ConfigurationServiceImpl(serviceId, logger, directory, tokenProvider, true, converter, null, 900);
  const catalog = { kind: 'actionCatalog', application: 'case-service', actions: {} };
  const revision = { data: { revision: 0, configuration: catalog } };

  beforeEach(() => {
    http.get.mockReset();
    http.get.mockResolvedValue(revision);
  });
  afterEach(() => jest.restoreAllMocks());

  it('does not make another configuration request on a second lookup', async () => {
    const service = createService();
    await service.getServiceConfiguration('actions-case-service', tenantA);
    http.get.mockClear();

    await service.getServiceConfiguration('actions-case-service', tenantA);

    expect(http.get).not.toHaveBeenCalled();
  });

  it('keeps tenant data isolated for the same application', async () => {
    const service = createService();
    http.get.mockResolvedValueOnce({ data: { revision: 0, configuration: { owner: 'case-team' } } });
    await service.getServiceConfiguration('actions-case-service', tenantA);
    http.get.mockResolvedValueOnce({ data: { revision: 0, configuration: { owner: 'payment-team' } } });

    const [configuration] = await service.getServiceConfiguration('actions-case-service', tenantB);

    expect(configuration).toEqual({ owner: 'payment-team' });
  });

  it('does not share catalogs across namespaces', async () => {
    const service = createService();
    await service.getServiceConfiguration('actions-case-service', tenantA);
    http.get.mockResolvedValue({ data: { revision: 0, configuration: { application: 'payment-service' } } });

    const [configuration] = await service.getServiceConfiguration('actions-payment-service', tenantA);

    expect(configuration).toEqual({ application: 'payment-service' });
  });

  it('refreshes the affected tenant after invalidation', async () => {
    const service = createService();
    await service.getServiceConfiguration('actions-case-service', tenantA);
    http.get.mockClear();
    service.clearCached(tenantA, 'audit-service', 'actions-case-service');

    await service.getServiceConfiguration('actions-case-service', tenantA);

    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('refreshes after the 15 minute TTL even without notification', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    const service = createService();
    await service.getServiceConfiguration('actions-case-service', tenantA);
    http.get.mockClear();
    clock.mockReturnValue(now + 900001);

    await service.getServiceConfiguration('actions-case-service', tenantA);

    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('serves an unexpired cache during a configuration service outage', async () => {
    const service = createService();
    await service.getServiceConfiguration('actions-case-service', tenantA);
    http.get.mockRejectedValue(new Error('Connection refused'));

    const [configuration] = await service.getServiceConfiguration('actions-case-service', tenantA);

    expect(configuration).toEqual(catalog);
  });

  it('logs cold read failures and returns null configuration', async () => {
    const service = createService();
    const warn = jest.spyOn(logger, 'warn');
    http.get.mockRejectedValue(new Error('Connection refused'));

    expect(await service.getServiceConfiguration('actions-case-service', tenantA)).toEqual([null, null, undefined]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Connection refused'),
      expect.objectContaining({ context: 'ConfigurationService' }),
    );
  });

  it('returns null configuration for converter validation errors', async () => {
    const service = createService(() => {
      throw new Error('Invalid action definition');
    });

    expect(await service.getServiceConfiguration('actions-case-service', tenantA)).toEqual([null, null, undefined]);
  });

  it('retains tenant configuration when Core retrieval fails', async () => {
    const service = createService();
    http.get.mockResolvedValueOnce(revision).mockRejectedValueOnce(new Error('Core configuration unavailable'));

    expect(await service.getServiceConfiguration('actions-case-service', tenantA)).toEqual([catalog, null, 0]);
  });

  it('returns null on refresh failure after expiry without a stale-cache fallback', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    const service = createService();
    await service.getServiceConfiguration('actions-case-service', tenantA);
    clock.mockReturnValue(now + 900001);
    http.get.mockRejectedValue(new Error('Configuration service unavailable'));

    expect(await service.getServiceConfiguration('actions-case-service', tenantA)).toEqual([null, null, undefined]);
  });

  it('preserves successful absent configuration responses', async () => {
    const service = createService();
    http.get.mockResolvedValue({ data: '' });

    expect(await service.getServiceConfiguration('actions-case-service', tenantA)).toEqual([null, null, undefined]);
  });

  it('does not cache a failed request as an absent catalog', async () => {
    const service = createService();
    http.get.mockRejectedValueOnce(new Error('Connection refused'));
    expect(await service.getServiceConfiguration('actions-case-service', tenantA)).toEqual([null, catalog, undefined]);

    const [configuration] = await service.getServiceConfiguration('actions-case-service', tenantA);

    expect(configuration).toEqual(catalog);
  });

  it('shares in-flight reads without exposing partially converted configuration', async () => {
    const service = createService();

    const results = await Promise.all([
      service.getServiceConfiguration('actions-case-service', tenantA),
      service.getServiceConfiguration('actions-case-service', tenantA),
    ]);

    expect(results[0]).toEqual(results[1]);
    expect(http.get).toHaveBeenCalledTimes(2);
  });

});
