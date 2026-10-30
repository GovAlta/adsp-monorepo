import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { createLogger, transports } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { CatalogService, CatalogUnavailableError } from './catalog';
import { REPLAY_ACTION, REPLAY_DEFINITION } from '../actions';

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

  it('does not supply a built-in replay action when the registered catalog is missing', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);
    expect(await service.getCatalog('audit-service', tenantId)).toBeNull();
    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-audit-service', tenantId);
  });

  it('uses the configured replay definition without overriding it with local constants', async () => {
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'audit-service',
      actions: { custom: REPLAY_DEFINITION, [REPLAY_ACTION]: { ...REPLAY_DEFINITION, version: 99 } },
    });
    expect((await service.getCatalog('audit-service', tenantId)).actions).toEqual({
      custom: REPLAY_DEFINITION,
      [REPLAY_ACTION]: { ...REPLAY_DEFINITION, version: 99 },
    });
  });

  it('reports a propagated SDK failure as unavailable', async () => {
    configuration.getServiceConfiguration.mockRejectedValue(new Error('Token provider unavailable'));

    await expect(service.getCatalog('case-service', tenantId)).rejects.toMatchObject({
      extra: { statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE },
    });
  });

  it('refuses a document stored under the wrong application name', async () => {
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'payment-service',
      actions: {},
    });

    await expect(service.getCatalog('case-service', tenantId)).rejects.toBeInstanceOf(CatalogUnavailableError);
  });

  describe('listCatalogs', () => {
    const source = { listApplications: jest.fn() };
    const listing = new CatalogService(configuration, logger, source);
    const catalogOf = (application: string) => ({ kind: 'actionCatalog', application, actions: {} });

    it('merges core and tenant applications once and flags core ones', async () => {
      source.listApplications.mockImplementation(async (tenant) => (tenant ? ['b-app', 'a-app'] : ['a-app', 'c-app']));
      configuration.getServiceConfiguration.mockImplementation(async (name: string) =>
        catalogOf(name.substring('actions-'.length)),
      );

      const result = await listing.listCatalogs(tenantId);

      expect(result.map(({ application, core }) => [application, core])).toEqual([
        ['a-app', true],
        ['b-app', false],
        ['c-app', true],
      ]);
    });

    it('lists only core catalogs without a tenant', async () => {
      source.listApplications.mockResolvedValue(['a-app']);
      configuration.getServiceConfiguration.mockResolvedValue(catalogOf('a-app'));

      await listing.listCatalogs();

      expect(source.listApplications).toHaveBeenCalledTimes(1);
    });

    it('reports a listing failure as unavailable', async () => {
      source.listApplications.mockRejectedValue(new Error('boom'));

      await expect(listing.listCatalogs(tenantId)).rejects.toBeInstanceOf(CatalogUnavailableError);
    });

    it('is unavailable when no source is configured', async () => {
      await expect(service.listCatalogs(tenantId)).rejects.toBeInstanceOf(CatalogUnavailableError);
    });
  });
});
