import { adspId, ConfigurationService, ServiceDirectory, TokenProvider, User } from '@abgov/adsp-service-sdk';
import { ServiceStatusApplicationEntity } from '../model';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ApplicationRepo } from './ApplicationRepo';

describe('ApplicationRepo', () => {
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/61e9adcc9423490012a9ae46`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/61e9adcc9423490012a9ae47`;
  const userA = { id: 'a', name: 'A', tenantId: tenantA, roles: ['status-admin'] } as unknown as User;
  const userB = { id: 'b', name: 'B', tenantId: tenantB, roles: ['status-admin'] } as unknown as User;

  const repository = { find: jest.fn(), save: jest.fn() };
  const applicationRepo = new ApplicationRepo(
    repository as unknown as ServiceStatusRepository,
    {} as EndpointStatusEntryRepository,
    adspId`urn:ads:platform:status-service`,
    {} as ServiceDirectory,
    {} as TokenProvider,
    {} as ConfigurationService,
  );

  const createStatus = (tenantId: string, status: 'operational' | 'outage') =>
    new ServiceStatusApplicationEntity(repository as unknown as ServiceStatusRepository, {
      appKey: 'portal',
      endpoint: { status: 'online' },
      metadata: '',
      statusTimestamp: 0,
      status,
      enabled: true,
      tenantId,
    });

  let statuses: ServiceStatusApplicationEntity[];

  beforeEach(() => {
    jest.resetAllMocks();
    statuses = [createStatus(tenantA.toString(), 'operational'), createStatus(tenantB.toString(), 'outage')];
    repository.find.mockImplementation((filter) =>
      Promise.resolve(
        statuses.filter((status) => status.appKey === filter.appKey && status.tenantId === filter.tenantId),
      ),
    );
    repository.save.mockImplementation((entity) => Promise.resolve(entity));
  });

  describe('findStatus', () => {
    it('returns the status of the tenant when another tenant has the same appKey', async () => {
      const result = await applicationRepo.findStatus('portal', tenantB.toString());

      expect(result.tenantId).toBe(tenantB.toString());
      expect(result.status).toBe('outage');
    });

    it('returns null when only another tenant has the appKey', async () => {
      statuses = [createStatus(tenantA.toString(), 'operational')];

      const result = await applicationRepo.findStatus('portal', tenantB.toString());

      expect(result).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('returns the status of the tenant of the user when another tenant has the same appKey', async () => {
      const result = await applicationRepo.getStatus(userA, 'portal');

      expect(result.tenantId).toBe(tenantA.toString());
      expect(result.status).toBe('operational');
    });

    it('creates a status for the tenant of the user when only another tenant has the appKey', async () => {
      statuses = [createStatus(tenantA.toString(), 'operational')];

      const result = await applicationRepo.getStatus(userB, 'portal');

      expect(result.tenantId).toBe(tenantB.toString());
      expect(result.status).toBe('');
      expect(repository.save).toHaveBeenCalledTimes(1);
    });
  });
});
