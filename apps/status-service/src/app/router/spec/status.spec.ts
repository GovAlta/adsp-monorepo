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
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('Service router', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const serviceId = adspId`urn:ads:platform:status-service`;

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

  const bobsStatusId = '624365fe3367d200110e17c5';
  const bobsAppKey = 'test-mock';
  const bobsApplicationStatus = {
    _id: bobsStatusId,
    appKey: 'test-mock',
    tenantId: tenantId.toString(),
    metadata: '',
    enabled: 'false',
    statusTimestamp: 0,
    status: 'maintenance',
    internalStatus: 'stopped',
    endpoint: { status: 'offline' },
    tenantName: 'platform',
    tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
  };

  const myStatusId = '620ae946ddd181001195caad';
  const myApplicationStatus = {
    _id: myStatusId,
    appKey: 'myapp-1',
    tenantId: tenantId.toString(),
    metadata: '',
    enabled: true,
    statusTimestamp: 1648247257463,
    status: 'operational',
    internalStatus: 'healthy',
    endpoint: { status: 'online' },
    tenantName: 'Platform',
    tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
  };

  const applicationStatusMock = [
    {
      ...myApplicationStatus,
    },
    {
      ...bobsApplicationStatus,

      enable: jest.fn(() => {
        return {
          ...bobsApplicationStatus,
          enabled: true,
        };
      }),

      disable: jest.fn(() => {
        return {
          ...bobsApplicationStatus,
          enabled: false,
        };
      }),
      setStatus: jest.fn(() =>
        Promise.resolve({
          ...bobsApplicationStatus,
          status: 'maintenance',
        })
      ),
      update: jest.fn(() =>
        Promise.resolve({
          ...bobsApplicationStatus,
          name: 'updated-app',
          internalStatus: 'stopped',
        })
      ),
      delete: jest.fn(() => Promise.resolve()),
      canAccessById: jest.fn(() => {
        return true;
      }),
    },
  ];

  const configurationMock = {
    [myStatusId]: {
      _id: myStatusId,
      appKey: 'myapp-1',
      name: 'MyApp 1',
      url: 'http://localhost',
      description: 'MyApp',
    },
    [bobsStatusId]: {
      _id: bobsStatusId,
      appKey: bobsAppKey,
      name: 'test-mock',
      url: 'http://www.yahoo.com',
      description: '',
    },
  };

  const entriesMock = [
    {
      repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
      ok: true,
      url: configurationMock[myStatusId].url,
      timestamp: 1649277360004,
      responseTime: 685,
      status: '200',
    },
    {
      repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
      ok: true,
      url: configurationMock[bobsStatusId].url,
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
        serviceId: serviceId,
      });

      expect(publicRouter).toBeTruthy();
      expect(router).toBeTruthy();
    });
  });

  describe('Can get applications', () => {
    it('Can get all applications', async () => {
      const returnMock = [
        {
          ...myApplicationStatus,
          name: configurationMock[myApplicationStatus._id].name,
          description: configurationMock[myApplicationStatus._id].description,
          endpoint: {
            status: myApplicationStatus.endpoint.status,
            url: configurationMock[myApplicationStatus._id].url,
          },
        },
        {
          ...bobsApplicationStatus,
          name: configurationMock[bobsApplicationStatus._id].name,
          description: configurationMock[bobsApplicationStatus._id].description,
          endpoint: {
            status: bobsApplicationStatus.endpoint.status,
            url: configurationMock[bobsApplicationStatus._id].url,
          },
        },
      ];

      const getApplicationsHandler = getApplications(
        serviceDirectoryMock,
        tokenProviderMock,
        loggerMock,
        serviceId,
        statusRepositoryMock
      );
      expect(getApplicationsHandler).toBeTruthy();
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {},
      } as unknown as Request;

      statusRepositoryMock.find.mockResolvedValueOnce(applicationStatusMock);
      serviceDirectoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://localhost'));
      axiosMock.get.mockResolvedValueOnce({ data: configurationMock });
      await getApplicationsHandler(req, resMock as unknown as Response, nextMock);

      expect(resMock.json).toHaveBeenCalledWith(expect.arrayContaining(returnMock));
    });

    it('Can get application entries', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
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
          appKey: bobsAppKey,
        },
      } as unknown as Request;
      getConfigurationMock.mockReturnValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.send).toHaveBeenCalledWith(expect.arrayContaining([entriesMock[1]]));
    });
  });

  describe('Can get applications by name for public', () => {
    it('Can get applications by name', async () => {
      statusRepositoryMock.find.mockResolvedValueOnce([applicationStatusMock[1]]);
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
        [bobsStatusId]: configurationMock[bobsStatusId],
      });
      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          {
            description: configurationMock[bobsStatusId].description,
            id: bobsStatusId,
            lastUpdated: null,
            name: configurationMock[bobsStatusId].name,
            status: bobsApplicationStatus.status,
          },
        ])
      );
    });
  });

  describe('Can toggle application', () => {
    it('Can enable application', async () => {
      const handler = enableApplication(loggerMock, statusRepositoryMock);
      const getConfigurationMock = jest.fn();
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: { appKey: bobsAppKey },
        getConfiguration: getConfigurationMock,
      } as unknown as Request;

      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
      getConfigurationMock.mockReturnValue(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...bobsApplicationStatus,
          enabled: true,
          endpoint: { status: bobsApplicationStatus.endpoint.status, url: configurationMock[bobsStatusId].url },
        })
      );
    });

    it('Can disable application', async () => {
      const handler = disableApplication(loggerMock, statusRepositoryMock);
      const getConfigurationMock = jest.fn();
      getConfigurationMock.mockReturnValue(configurationMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: { appKey: bobsAppKey },
        getConfiguration: getConfigurationMock,
      } as unknown as Request;
      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...bobsApplicationStatus,
          enabled: false,
          endpoint: { status: bobsApplicationStatus.endpoint.status, url: configurationMock[bobsStatusId].url },
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
        params: { appKey: bobsAppKey },
      } as unknown as Request;

      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
      getConfigurationMock.mockReturnValue(configurationMock);
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
      const createMock = jest.fn().mockReturnValue(applicationStatusMock[1]);
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
    it('Can update application properties', async () => {
      const handler = updateApplication(loggerMock, tokenProviderMock, serviceDirectoryMock, statusRepositoryMock);
      const getConfigurationMock = jest.fn();
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
        getConfiguration: getConfigurationMock,
        params: {
          appKey: bobsAppKey,
        },
      } as unknown as Request;
      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
      getConfigurationMock.mockReturnValueOnce(configurationMock);

      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'updated-app',
          description: 'mock 10',
          endpoint: { status: bobsApplicationStatus.endpoint.status, url: 'http://mock-me.com' },
        })
      );
    });

    it('Can update application status', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
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
          appKey: bobsAppKey,
        },
        body: {
          status: 'maintenance',
        },
      } as unknown as Request;
      getConfigurationMock.mockReturnValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'maintenance',
        })
      );
    });
    it('Can delete application', async () => {
      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
      const handler = deleteApplication(loggerMock, tokenProviderMock, serviceDirectoryMock, statusRepositoryMock);
      const getConfigurationMock = jest.fn();
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {
          appKey: bobsAppKey,
        },
        getConfiguration: getConfigurationMock,
      } as unknown as Request;
      getConfigurationMock.mockReturnValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });
  });
});
