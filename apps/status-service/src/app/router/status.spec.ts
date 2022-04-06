import { Logger } from 'winston';
import { createPublicServiceStatusRouter } from './publicServiceStatus';
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
} from './serviceStatus';
import { adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { ServiceStatusApplicationEntity } from '../model';
import * as eventFuncs from '../events';
import { DomainEvent } from '@abgov/adsp-service-sdk';

describe('Service router', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
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

  const endpointRepositoryMock = {
    findRecentByUrl: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const next = jest.fn();
  const applicationsMock = [
    {
      repository: {},
      _id: '620ae946ddd181001195caad',
      endpoint: { status: 'online', url: 'https://www.yahoo.com' },
      metadata: '',
      name: 'MyApp 1',
      description: 'MyApp',
      statusTimestamp: 1648247257463,
      tenantId: tenantId.toString(),
      tenantName: 'Platform',
      tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      status: 'operational',
      enabled: true,
      internalStatus: 'healthy',
    },
    {
      repository: {},
      _id: '624365fe3367d200110e17c5',
      endpoint: { status: 'offline', url: 'https://localhost.com' },
      metadata: '',
      name: 'paul-test',
      description: '',
      statusTimestamp: 0,
      tenantId: tenantId.toString(),
      tenantName: 'Platform',
      tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      enabled: false,
      internalStatus: 'stopped',
      enable: jest.fn((app) => {
        return {
          ...app,
          enabled: true,
        };
      }),

      disable: jest.fn((app) => {
        return {
          ...app,
          enabled: false,
        };
      }),
      setStatus: jest.fn(() =>
        Promise.resolve({
          name: 'status-updated-app',
          internalStatus: 'stopped',
        })
      ),
      update: jest.fn(() =>
        Promise.resolve({
          name: 'updated-app',
          internalStatus: 'stopped',
        })
      ),
      delete: jest.fn(() => Promise.resolve()),
    },
  ];

  const statusRepositoryMock = {
    findEnabledApplications: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
    setStatus: jest.fn(),
  };

  const res = {
    json: jest.fn(),
    sendStatus: jest.fn(),
    send: jest.fn(),
    status: jest.fn(() => {
      return {
        json: jest.fn(),
      };
    }),
  } as unknown as Response;

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
      await getApplicationsHandler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(applicationsMock));
    });

    const entriesMock = [
      {
        repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
        ok: true,
        url: 'https://www.yahoo.com',
        timestamp: 1649277360004,
        responseTime: 685,
        status: '200',
      },
      {
        repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
        ok: true,
        url: 'https://www.yahoo.com',
        timestamp: 1649277300002,
        responseTime: 514,
        status: '200',
      },
    ];

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
      await handler(req, res, next);
      expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([entriesMock[1]]));
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
      await handler(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
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
      await handler(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
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
      await handler(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
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
      await handler(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
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

      await handler(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
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
      await handler(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
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
      await handler(req, res, next);
      expect(res.sendStatus).toHaveBeenCalledWith(204);
    });
  });
});
