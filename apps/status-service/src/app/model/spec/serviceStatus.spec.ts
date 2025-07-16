import { ServiceStatusApplicationEntity } from '../serviceStatus';
import { EndpointStatusType, InternalServiceStatusType, PublicServiceStatusType } from '../../types';
import type { User } from '@abgov/adsp-service-sdk';

describe('ServiceStatusApplicationEntity', () => {
  const repositoryMock = {
    findRecentByUrlAndApplicationId: jest.fn(),
    findRecent: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    findEnabledApplications: jest.fn(),
    find: jest.fn(),
    disable: jest.fn(),
    enable: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
  };
  const endpointMock = {
    status: 'offline' as EndpointStatusType,
    id: '12345',
    url: 'http://yahoo.com',
    statusEntries: [],
  };

  const applicationEntityMock = {
    metadata: '',
    description: 'for mock test ',
    statusTimestamp: 0,
    tenantId: 'urn:ads:mock-tenant:mock-service:/tenants/mock-tenant-id',
    tenantName: 'mock-tenant',
    appKey: 'mock-tenant-app-0',
    tenantRealm: 'mock-realm',
    enabled: false,
    internalStatus: 'stopped' as InternalServiceStatusType,
    endpoint: endpointMock,
  };

  const userMock = {} as User;

  beforeEach(() => {
    repositoryMock.save.mockReset();
    repositoryMock.enable.mockReset();
    repositoryMock.disable.mockReset();
  });

  describe('Can update create repository', () => {
    it('Can create the entity repository', () => {
      const entityRepository = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      expect(entityRepository).toBeTruthy();
    });

    it('Can create new entity', async () => {
      await ServiceStatusApplicationEntity.create(userMock, repositoryMock, applicationEntityMock);
      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          appKey: applicationEntityMock.appKey,
        })
      );
    });
  });

  describe('Can update entity', () => {
    it('Can update entity', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      entity.update(userMock, applicationEntityMock);
      expect(repositoryMock.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endpoint: applicationEntityMock.endpoint,
        })
      );
    });
  });

  describe('Can toggle entity', () => {
    it('Can enable entity', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      entity.enable(userMock);
      expect(repositoryMock.enable).toHaveBeenCalledWith(
        expect.objectContaining({
          appKey: applicationEntityMock.appKey,
        })
      );
    });

    it('Can enable disable', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      entity.disable(userMock);
      expect(repositoryMock.disable).toHaveBeenCalledWith(
        expect.objectContaining({
          appKey: applicationEntityMock.appKey,
        })
      );
    });
  });

  describe('Can set status', () => {
    it('Can set new status', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      entity.setStatus(userMock, 'operational' as PublicServiceStatusType);

      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'operational',
        })
      );
    });
  });

  describe('Can delete new entry', () => {
    it('Can delete new entry', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);

      await entity.delete(userMock);
      expect(repositoryMock.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          appKey: applicationEntityMock.appKey,
        })
      );
    });
  });
});
