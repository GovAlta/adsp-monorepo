import { mocked } from 'ts-jest/utils';
import { Logger } from 'winston';
import { createPublicServiceStatusRouter } from './publicServiceStatus';
import { createServiceStatusRouter } from './serviceStatus';
import { TenantService } from '@abgov/adsp-service-sdk';
import { logger } from '../../../../tenant-management-api/src/middleware/logger';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';

describe('Service router', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const statusRepositoryMock = {
    findEnabledApplications: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };
  const endpointRepositoryMock = {
    findRecentByUrl: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };

  describe('createStatusServiceRouter', () => {
    it('Can create status service routers', () => {
      const publicRouter = createPublicServiceStatusRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock,
        serviceStatusRepository: statusRepositoryMock,
      });

      const router = createServiceStatusRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock,
        eventService: eventServiceMock,
        serviceStatusRepository: statusRepositoryMock,
        endpointStatusEntryRepository: endpointRepositoryMock,
      });

      expect(publicRouter).toBeTruthy();
      expect(router).toBeTruthy();
    });
  });
});
