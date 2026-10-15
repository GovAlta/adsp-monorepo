import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { createLogger, transports } from 'winston';
import { CatalogService, CatalogUnavailableError } from './catalog';

describe('CatalogService', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const service = new CatalogService(configuration, logger);

  beforeEach(() => jest.resetAllMocks());

  it('requests the tenant and application named configuration', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    await service.getCatalog('case-service', tenantId);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantId);
  });

  it('returns missing without converting it into an empty catalog', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    expect(await service.getCatalog('case-service', tenantId)).toBeNull();
  });

  it('preserves the registered empty state', async () => {
    const catalog = { kind: 'actionCatalog', application: 'case-service', actions: {} };
    configuration.getServiceConfiguration.mockResolvedValue(catalog);

    expect(await service.getCatalog('case-service', tenantId)).toEqual(catalog);
  });

  it('reports a propagated SDK failure as unavailable', async () => {
    configuration.getServiceConfiguration.mockRejectedValue(new Error('Token provider unavailable'));

    await expect(service.getCatalog('case-service', tenantId)).rejects.toMatchObject({ extra: { statusCode: 503 } });
  });

  it('refuses a document stored under the wrong application name', async () => {
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'payment-service',
      actions: {},
    });

    await expect(service.getCatalog('case-service', tenantId)).rejects.toBeInstanceOf(CatalogUnavailableError);
  });
});
