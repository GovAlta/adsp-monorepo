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

  describe('addAction', () => {
    const source = { listApplications: jest.fn() };
    const store = { readActionNames: jest.fn(), saveAction: jest.fn(), removeAction: jest.fn() };
    const adding = new CatalogService(configuration, logger, source, store);
    const definition = { version: 1, category: 'runtime', severity: 'info', retentionClass: 'standard' } as never;
    const core = { 'audit-service': ['retention.run', 'events.list'] } as Record<string, string[]>;

    beforeEach(() => {
      source.listApplications.mockResolvedValue(['audit-service']);
      store.readActionNames.mockImplementation(async (application: string, tenant?: unknown) =>
        tenant ? ['sample-action'] : (core[application] ?? null),
      );
      store.saveAction.mockReset().mockResolvedValue(undefined);
      store.removeAction.mockReset().mockResolvedValue(undefined);
    });

    it('adds an unused name to the tenant catalog', async () => {
      await adding.addAction('sandbox-app', 'my-action', definition, tenantId, 'token');

      expect(store.saveAction).toHaveBeenCalledWith('sandbox-app', 'my-action', definition, 'token', tenantId);
    });

    it('creates the catalog when the tenant has none', async () => {
      store.readActionNames.mockImplementation(async (application: string, tenant?: unknown) =>
        tenant ? null : core[application],
      );

      await adding.addAction('sandbox-app', 'my-action', definition, tenantId, 'token');

      expect(store.saveAction).toHaveBeenCalledWith('sandbox-app', 'my-action', definition, 'token', tenantId);
    });

    it('serialises concurrent adds to one catalog so the second sees the first', async () => {
      const saved: string[] = [];
      store.readActionNames.mockImplementation(async (application: string, tenant?: unknown) =>
        tenant ? [...saved] : core[application],
      );
      store.saveAction.mockImplementation(async (_app: string, name: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        saved.push(name);
      });

      const results = await Promise.allSettled([
        adding.addAction('sandbox-app', 'Alpha', definition, tenantId, 'token'),
        adding.addAction('sandbox-app', 'alpha', definition, tenantId, 'token'),
      ]);

      expect(results.map(({ status }) => status)).toEqual(['fulfilled', 'rejected']);
      expect(saved).toEqual(['Alpha']);
    });

    it('backs out when a concurrent request added the same name in a different case first', async () => {
      store.readActionNames.mockImplementation(async (application: string, tenant?: unknown) =>
        tenant ? (store.saveAction.mock.calls.length ? ['Alpha', 'alpha'] : []) : core[application],
      );

      await expect(adding.addAction('sandbox-app', 'alpha', definition, tenantId, 'token')).rejects.toMatchObject({
        extra: { statusCode: HttpStatusCodes.CONFLICT },
      });
      expect(store.removeAction).toHaveBeenCalledWith('sandbox-app', 'alpha', 'token', tenantId);
    });

    it('keeps its action when the concurrent twin sorts after it', async () => {
      store.readActionNames.mockImplementation(async (application: string, tenant?: unknown) =>
        tenant ? (store.saveAction.mock.calls.length ? ['Alpha', 'alpha'] : []) : core[application],
      );

      await adding.addAction('sandbox-app', 'Alpha', definition, tenantId, 'token');

      expect(store.removeAction).not.toHaveBeenCalled();
    });

    it.each([
      ['a Core action', 'retention.run'],
      ['a Core action in a different case', 'Retention.RUN'],
    ])('rejects %s', async (_label, name) => {
      await expect(adding.addAction('sandbox-app', name, definition, tenantId, 'token')).rejects.toMatchObject({
        extra: { statusCode: HttpStatusCodes.CONFLICT },
      });
      expect(store.saveAction).not.toHaveBeenCalled();
    });

    it('allows a name that only extends a Core action name', async () => {
      await adding.addAction('sandbox-app', 'retention.run.succeeded', definition, tenantId, 'token');

      expect(store.saveAction).toHaveBeenCalled();
    });

    it('rejects a name already in the namespace catalog, ignoring case', async () => {
      await expect(
        adding.addAction('sandbox-app', 'Sample-Action', definition, tenantId, 'token'),
      ).rejects.toMatchObject({ extra: { statusCode: HttpStatusCodes.CONFLICT } });
    });

    it('rejects changes to a Core namespace', async () => {
      await expect(
        adding.addAction('audit-service', 'new-action', definition, tenantId, 'token'),
      ).rejects.toMatchObject({
        extra: { statusCode: HttpStatusCodes.CONFLICT },
      });
    });

    it('reports a failed check as unavailable and writes nothing', async () => {
      store.readActionNames.mockRejectedValue(new Error('boom'));

      await expect(adding.addAction('sandbox-app', 'my-action', definition, tenantId, 'token')).rejects.toBeInstanceOf(
        CatalogUnavailableError,
      );
      expect(store.saveAction).not.toHaveBeenCalled();
    });
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
