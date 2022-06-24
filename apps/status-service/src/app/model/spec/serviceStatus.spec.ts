import { ServiceStatusApplicationEntity } from '../serviceStatus';
import { EndpointStatusType, InternalServiceStatusType, PublicServiceStatusType } from '../../types';
import type { User } from '@abgov/adsp-service-sdk';

describe('ServiceStatusApplicationEntity', () => {
  const repositoryMock = {
    findRecentByUrlAndApplicationId: jest.fn(),
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
    url: 'https://www.mock-test.com',
    id: '12345',
    statusEntries: [],
  };

  const applicationEntityMock = {
    metadata: '',
    name: 'mock-test-application-entity',
    description: 'for mock test ',
    statusTimestamp: 0,
    tenantId: 'urn:ads:mock-tenant:mock-service:/tenants/mock-tenant-id',
    tenantName: 'mock-tenant',
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
          name: applicationEntityMock.name,
        })
      );
    });
  });

  describe('Can update entity with existed url', () => {
    it('Can update entity with existed url', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      entity.update(userMock, applicationEntityMock);
      expect(repositoryMock.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endpoint: applicationEntityMock.endpoint,
        })
      );
    });

    it('Can update entity with new url', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      const entityToBeUpdate = {
        ...applicationEntityMock,
        endpoint: {
          ...endpointMock,
          url: 'https://www.mock-test-new.com',
        },
      };
      entity.update(userMock, entityToBeUpdate);
      expect(repositoryMock.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endpoint: { ...entityToBeUpdate.endpoint, status: 'n/a' },
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
          name: applicationEntityMock.name,
        })
      );
    });

    it('Can enable disable', async () => {
      const entity = new ServiceStatusApplicationEntity(repositoryMock, applicationEntityMock);
      entity.disable(userMock);
      expect(repositoryMock.disable).toHaveBeenCalledWith(
        expect.objectContaining({
          name: applicationEntityMock.name,
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
          name: applicationEntityMock.name,
        })
      );
    });
  });
});
