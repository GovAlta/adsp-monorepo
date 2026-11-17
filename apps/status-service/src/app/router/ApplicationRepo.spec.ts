import { adspId, ConfigurationService, ServiceDirectory, TokenProvider, User } from '@abgov/adsp-service-sdk';
import { ApplicationRepo } from './ApplicationRepo';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';

describe('ApplicationRepo tenant scoping', () => {
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/b`;
  const statuses = [
    { appKey: 'portal', tenantId: tenantA.toString(), status: 'operational' },
    { appKey: 'portal', tenantId: tenantB.toString(), status: 'outage' },
  ];

  const repository = {
    find: jest.fn(async (filter: { appKey: string; tenantId: string }) =>
      statuses.filter((s) => s.appKey === filter.appKey && (!filter.tenantId || s.tenantId === filter.tenantId)),
    ),
    save: jest.fn((entity) => Promise.resolve(entity)),
  } as unknown as ServiceStatusRepository;

  const repo = new ApplicationRepo(
    repository,
    {} as EndpointStatusEntryRepository,
    adspId`urn:ads:platform:status-service`,
    {} as ServiceDirectory,
    {} as TokenProvider,
    {} as ConfigurationService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getStatus returns the status of the caller tenant only', async () => {
    const user = { tenantId: tenantB, roles: ['urn:ads:platform:status-service:status-admin'] } as unknown as User;

    const status = await repo.getStatus(user, 'portal');

    expect(repository.find).toHaveBeenCalledWith({ appKey: 'portal', tenantId: tenantB.toString() });
    expect(status.status).toBe('outage');
  });

  it('findStatus returns the status of the given tenant only', async () => {
    const status = await repo.findStatus('portal', tenantA.toString());

    expect(repository.find).toHaveBeenCalledWith({ appKey: 'portal', tenantId: tenantA.toString() });
    expect(status.status).toBe('operational');
  });

  it('findStatus returns null when the tenant has no status', async () => {
    const status = await repo.findStatus('portal', 'urn:ads:platform:tenant-service:v2:/tenants/c');

    expect(status).toBeNull();
  });
});
