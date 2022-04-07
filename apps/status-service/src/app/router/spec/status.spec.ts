import { createPublicServiceStatusRouter, getApplicationsByName } from '../publicServiceStatus';
import {
  createServiceStatusRouter,
  getApplications,
  enableApplication,
  disableApplication,
  toggleApplication,
  createNewApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationEntries,
} from '../serviceStatus';
import { Request, Response } from 'express';
import { ServiceStatusApplicationEntity } from '../../model';
import * as eventFuncs from '../../events';
import { DomainEvent } from '@abgov/adsp-service-sdk';
import {
  loggerMock,
  endpointRepositoryMock,
  entriesMock,
  tenantServiceMock,
  applicationsMock,
  nextMock,
  eventServiceMock,
  statusRepositoryMock,
  resMock,
  tenantId,
} from './mock';

describe('Service router', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
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

  describe('Can get applications', () => {
    it('Can get all applications', async () => {
      const getApplicationsHandler = getApplications(loggerMock, statusRepositoryMock);
      expect(getApplicationsHandler).toBeTruthy();
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        getConfiguration: jest.fn(),
        params: {},
      } as unknown as Request;

      statusRepositoryMock.find.mockResolvedValueOnce(applicationsMock);
      await getApplicationsHandler(req, resMock as unknown as Response, nextMock);

      expect(resMock.json).toHaveBeenCalledWith(expect.arrayContaining(applicationsMock));
    });

    it('Can get application entries', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      endpointRepositoryMock.findRecentByUrl.mockResolvedValueOnce(entriesMock);
      const handler = getApplicationEntries(loggerMock, statusRepositoryMock, endpointRepositoryMock);

      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        getConfiguration: jest.fn(),
        query: { topValue: 1 },
        params: {
          applicationId: statusRepositoryMock[1],
        },
      } as unknown as Request;
      await handler(req, resMock, nextMock);
      expect(resMock.send).toHaveBeenCalledWith(expect.arrayContaining([entriesMock[1]]));
    });
  });

  describe('Can get applications by name for public', () => {
    it('Can get applications by name', async () => {
      statusRepositoryMock.find.mockResolvedValueOnce([applicationsMock[1]]);
      const handler = getApplicationsByName(loggerMock, tenantServiceMock, statusRepositoryMock);
      const reqMock = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {
          name: 'test-mock',
        },
      } as unknown as Request;

      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          { description: '', id: '624365fe3367d200110e17c5', lastUpdated: null, name: 'test-mock', status: 'offline' },
        ])
      );
    });
  });

  describe('Can toggle application', () => {
    it('Can enable application', async () => {
      const handler = enableApplication(loggerMock, statusRepositoryMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {},
      } as unknown as Request;

      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('Can disable application', async () => {
      const handler = disableApplication(loggerMock, statusRepositoryMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {},
      } as unknown as Request;
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('Can toggle application', async () => {
      const handler = toggleApplication(loggerMock, statusRepositoryMock, eventServiceMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {},
      } as unknown as Request;

      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      );
    });
  });
  describe('Can create application', () => {
    it('Can create new application', async () => {
      const createMock = jest.fn().mockReturnValue(applicationsMock[1]);
      ServiceStatusApplicationEntity.create = createMock;
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        body: {
          name: 'mock-application',
          description: 'mock test application',
          endpoint: 'http://mock-test.com',
        },
      } as unknown as Request;
      const handler = createNewApplication(loggerMock, tenantServiceMock, statusRepositoryMock);
      await handler(req, resMock, nextMock);
      expect(resMock.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Can update application', () => {
    it('Can update application', async () => {
      const handler = updateApplication(loggerMock, statusRepositoryMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        body: {
          name: 'mock-application',
          description: 'mock test application',
          endpoint: 'http://mock-test.com',
        },
        params: {
          id: tenantId.toString(),
        },
      } as unknown as Request;
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);

      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'updated-app',
        })
      );
    });

    it('Can update application status', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      jest.spyOn(eventFuncs, 'applicationStatusChange').mockReturnValue({} as unknown as DomainEvent);

      const handler = updateApplicationStatus(loggerMock, statusRepositoryMock, eventServiceMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {
          id: applicationsMock[1]._id,
        },
        body: {
          status: 'online',
        },
      } as unknown as Request;
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'status-updated-app',
        })
      );
    });
    it('Can delete application', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      const handler = deleteApplication(loggerMock, statusRepositoryMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {
          id: applicationsMock[1]._id,
        },
      } as unknown as Request;
      await handler(req, resMock, nextMock);
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });
  });
});
