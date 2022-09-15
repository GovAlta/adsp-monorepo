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
import { Logger } from 'winston';
import { adspId } from '@abgov/adsp-service-sdk';

jest.mock('axios');

describe('Service router', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tenantServiceMock = {
    getTenants: jest.fn(() => Promise.resolve([{ id: tenantId, name: 'test-mock', realm: 'test' }])),
    getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('Toot!')),
  };

  const serviceDirectoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
    getResourceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
  };

  const endpointRepositoryMock = {
    findRecentByUrlAndApplicationId: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };

  const nextMock = jest.fn();

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
      name: 'test-mock',
      description: '',
      statusTimestamp: 0,
      tennantServRef: '{}',
      tenantId: tenantId.toString(),
      tenantName: 'Platform',
      tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      enabled: false,
      internalStatus: 'stopped',
      status: 'offline',
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
          tennantServRef: '{}',
        })
      ),
      delete: jest.fn(() => Promise.resolve()),
      canAccessById: jest.fn(() => {
        return true;
      }),
    },
  ];

  const configurationMock = {
    [applicationsMock[0]._id]: {
      _id: applicationsMock[0]._id,
      name: applicationsMock[0].name,
      url: applicationsMock[0].endpoint.url,
      description: applicationsMock[0].description,
    },
    [applicationsMock[1]._id]: {
      _id: applicationsMock[1]._id,
      name: applicationsMock[1].name,
      url: applicationsMock[1].endpoint.url,
      description: applicationsMock[1].description,
    },
  };

  const entriesMock = [
    {
      repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
      ok: true,
      url: applicationsMock[0].endpoint.url,
      timestamp: 1649277360004,
      responseTime: 685,
      status: '200',
    },
    {
      repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
      ok: true,
      url: applicationsMock[1].endpoint.url,
      timestamp: 1649277300002,
      responseTime: 514,
      status: '200',
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

  const resMock = {
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
        tokenProvider: tokenProviderMock,
        directory: serviceDirectoryMock,
      });

      expect(publicRouter).toBeTruthy();
      expect(router).toBeTruthy();
    });
  });

  describe('Can get applications', () => {
    it('Can get all applications', async () => {
      const returnMock = [
        {
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
          internalStatus: 'healthy',
          enabled: true,
        },
        {
          _id: '624365fe3367d200110e17c5',
          endpoint: { status: 'offline', url: 'https://localhost.com' },
          metadata: '',
          name: 'test-mock',
          description: '',
          statusTimestamp: 0,
          tenantId: tenantId.toString(),
          tenantName: 'Platform',
          tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
          status: 'offline',
          internalStatus: 'stopped',
          enabled: false,
        },
      ];

      const getApplicationsHandler = getApplications(loggerMock, statusRepositoryMock);
      const getConfigurationMock = jest.fn();
      expect(getApplicationsHandler).toBeTruthy();
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        getConfiguration: getConfigurationMock,
        params: {},
      } as unknown as Request;

      statusRepositoryMock.find.mockResolvedValueOnce(applicationsMock);
      getConfigurationMock.mockReturnValueOnce(configurationMock);
      await getApplicationsHandler(req, resMock as unknown as Response, nextMock);

      expect(resMock.json).toHaveBeenCalledWith(expect.arrayContaining(returnMock));
    });

    it('Can get application entries', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      endpointRepositoryMock.findRecentByUrlAndApplicationId.mockResolvedValueOnce(entriesMock);
      const handler = getApplicationEntries(loggerMock, statusRepositoryMock, endpointRepositoryMock);
      const getConfigurationMock = jest.fn();

      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        getConfiguration: getConfigurationMock,
        query: { topValue: 1 },
        params: {
          applicationId: applicationsMock[1]._id,
        },
      } as unknown as Request;
      getConfigurationMock.mockReturnValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.send).toHaveBeenCalledWith(expect.arrayContaining([entriesMock[1]]));
    });
  });

  describe('Can get applications by name for public', () => {
    it('Can get applications by name', async () => {
      statusRepositoryMock.find.mockResolvedValueOnce([applicationsMock[1]]);
      const getConfigurationMock = jest.fn();
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
        getConfiguration: getConfigurationMock,
      } as unknown as Request;

      getConfigurationMock.mockReturnValueOnce({
        ['624365fe3367d200110e17c5']: {
          name: 'test-mock',
          url: 'https://www.yahoo.com',
          description: 'Woof',
        },
      });
      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          {
            description: 'Woof',
            id: '624365fe3367d200110e17c5',
            lastUpdated: null,
            name: 'test-mock',
            status: 'offline',
          },
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
      const getConfigurationMock = jest.fn();
      const req: Request = {
        user: {
          tenantId,
          id: 'tester',
          roles: ['test-updater'],
        },
        getConfiguration: getConfigurationMock,
        params: { id: applicationsMock[1]._id },
      } as unknown as Request;

      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      getConfigurationMock.mockReturnValueOnce(configurationMock);
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
      const handler = createNewApplication(
        loggerMock,
        tenantServiceMock,
        tokenProviderMock,
        serviceDirectoryMock,
        statusRepositoryMock
      );
      await handler(req, resMock, nextMock);
      expect(resMock.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Can update application', () => {
    it('Can update application', async () => {
      const handler = updateApplication(loggerMock, tokenProviderMock, serviceDirectoryMock, statusRepositoryMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        body: {
          name: 'updated-app',
          description: 'mock 10',
          endpoint: { url: 'http://mock-me.com' },
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
          description: 'mock 10',
          endpoint: { status: 'offline', url: 'http://mock-me.com' },
        })
      );
    });

    it('Can update application status', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      const getConfigurationMock = jest.fn();
      jest.spyOn(eventFuncs, 'applicationStatusChange').mockReturnValue({} as unknown as DomainEvent);

      const handler = updateApplicationStatus(loggerMock, statusRepositoryMock, eventServiceMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        getConfiguration: getConfigurationMock,
        params: {
          id: applicationsMock[1]._id,
        },
        body: {
          status: 'online',
        },
      } as unknown as Request;
      getConfigurationMock.mockReturnValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'status-updated-app',
        })
      );
    });
    it('Can delete application', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      const handler = deleteApplication(loggerMock, tokenProviderMock, serviceDirectoryMock, statusRepositoryMock);
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
