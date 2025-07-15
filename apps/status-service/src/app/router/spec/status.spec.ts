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
import { DomainEvent, ConfigurationService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { InvalidValueError } from '@core-services/core-common';
import { ApplicationRepo } from '../ApplicationRepo';
import { ServiceStatusApplication } from '../../types';

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
    findRecent: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
    deleteAll: jest.fn(),
  };

  const nextMock = jest.fn();

  const bobsStatusId = '624365fe3367d200110e17c5';
  const bobsAppKey = 'test-test-mock';
  const bobsApplicationStatus: ServiceStatusApplication = {
    _id: bobsStatusId,
    appKey: bobsAppKey,
    metadata: '',
    enabled: false,
    statusTimestamp: 0,
    status: 'maintenance',
    internalStatus: 'stopped',
    endpoint: { status: 'offline' },
    tenantId: tenantId.toString(),
  };

  const myStatusId = '620ae946ddd181001195caad';
  const myAppKey = 'myapp-1';
  const myApplicationStatus: ServiceStatusApplication = {
    _id: myStatusId,
    appKey: myAppKey,
    metadata: '',
    enabled: true,
    statusTimestamp: 1648247257463,
    status: 'operational',
    internalStatus: 'healthy',
    endpoint: { status: 'online' },
    tenantId: tenantId.toString(),
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
    [myAppKey]: {
      appKey: myAppKey,
      name: 'MyApp 1',
      url: 'http://localhost',
      description: 'MyApp',
    },
    [bobsAppKey]: {
      appKey: bobsAppKey,
      name: 'test-mock',
      url: 'http://www.yahoo.com',
      description: '',
    },
  };

  const entriesMock = [
    {
      appKey: myAppKey,
      repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
      ok: true,
      url: configurationMock[myAppKey].url,
      timestamp: 1649277360004,
      responseTime: 685,
      status: '200',
    },
    {
      appKey: bobsAppKey,
      repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
      ok: true,
      url: configurationMock[bobsAppKey].url,
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
    getStatus: jest.fn(),
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

  const configurationService = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  };

  const applicationRepo = new ApplicationRepo(
    statusRepositoryMock,
    endpointRepositoryMock,
    serviceId,
    serviceDirectoryMock,
    tokenProviderMock,
    configurationService
  );

  describe('createStatusServiceRouter', () => {
    beforeEach(() => {
      configurationService.getConfiguration.mockClear();
    });
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
        configurationService: configurationService as unknown as ConfigurationService,
      });

      expect(publicRouter).toBeTruthy();
      expect(router).toBeTruthy();
    });
  });

  describe('Can get applications', () => {
    it('Can get all applications', async () => {
      const { _id: _, ...myStatus } = myApplicationStatus;
      const { _id: __, ...bobsStatus } = bobsApplicationStatus;
      const returnMock = [
        {
          ...myStatus,
          name: configurationMock[myAppKey].name,
          description: configurationMock[myAppKey].description,
          endpoint: {
            status: myApplicationStatus.endpoint.status,
            url: configurationMock[myAppKey].url,
          },
          tenantId: tenantId.toString(),
        },
        {
          ...bobsStatus,
          name: configurationMock[bobsAppKey].name,
          description: configurationMock[bobsAppKey].description,
          endpoint: {
            status: bobsApplicationStatus.endpoint.status,
            url: configurationMock[bobsAppKey].url,
          },
          tenantId: tenantId.toString(),
        },
      ];

      const getApplicationsHandler = getApplications(loggerMock, applicationRepo);
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
      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
      await getApplicationsHandler(req, resMock as unknown as Response, nextMock);

      expect(resMock.json).toHaveBeenCalledWith(expect.arrayContaining(returnMock));
    });

    it('Can get application entries', async () => {
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        query: { topValue: 1 },
        params: {
          appKey: bobsAppKey,
        },
      } as unknown as Request;

      const handler = getApplicationEntries(loggerMock, applicationRepo, endpointRepositoryMock);
      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[0]);
      endpointRepositoryMock.findRecentByUrlAndApplicationId.mockResolvedValueOnce([entriesMock[1]]);
      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            url: entriesMock[1].url,
            responseTime: entriesMock[1].responseTime,
            timestamp: entriesMock[1].timestamp,
            status: entriesMock[1].status,
          }),
        ])
      );
    });
  });

  describe('Can get applications by name for public', () => {
    it('Can get applications by name', async () => {
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

      getConfigurationMock.mockReturnValue({
        [bobsAppKey]: configurationMock[bobsAppKey],
      });
      statusRepositoryMock.find.mockResolvedValueOnce([applicationStatusMock[0]]);
      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          {
            description: configurationMock[bobsAppKey].description,
            id: bobsAppKey,
            lastUpdated: null,
            name: configurationMock[bobsAppKey].name,
            status: '',
          },
        ])
      );
    });
  });

  describe('Can toggle application', () => {
    it('Can enable application', async () => {
      const handler = enableApplication(loggerMock, applicationRepo);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: { appKey: bobsAppKey },
      } as unknown as Request;

      statusRepositoryMock.find.mockResolvedValue([
        new ServiceStatusApplicationEntity(statusRepositoryMock, bobsApplicationStatus),
      ]);
      statusRepositoryMock.enable.mockResolvedValueOnce(
        new ServiceStatusApplicationEntity(statusRepositoryMock, { ...bobsApplicationStatus, enabled: true })
      );
      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      const { _id, ...almostExpected } = bobsApplicationStatus;
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...almostExpected,
          enabled: true,
          internalStatus: 'unhealthy',
          endpoint: { status: bobsApplicationStatus.endpoint.status, url: configurationMock[bobsAppKey].url },
        })
      );
    });

    it('Can disable application', async () => {
      const handler = disableApplication(loggerMock, applicationRepo);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: { appKey: bobsAppKey },
      } as unknown as Request;
      statusRepositoryMock.find.mockResolvedValueOnce([
        new ServiceStatusApplicationEntity(statusRepositoryMock, bobsApplicationStatus),
      ]);
      statusRepositoryMock.disable.mockResolvedValueOnce(
        new ServiceStatusApplicationEntity(statusRepositoryMock, { ...bobsApplicationStatus, enabled: false })
      );
      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      const { _id, ...expected } = bobsApplicationStatus;
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...expected,
          enabled: false,
          endpoint: { status: bobsApplicationStatus.endpoint.status, url: configurationMock[bobsAppKey].url },
        })
      );
    });

    it('Can toggle application', async () => {
      const handler = toggleApplication(loggerMock, applicationRepo, eventServiceMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'tester',
          roles: ['test-updater'],
        },
        params: { appKey: bobsAppKey },
      } as unknown as Request;

      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
      statusRepositoryMock.find.mockResolvedValueOnce([
        new ServiceStatusApplicationEntity(statusRepositoryMock, bobsApplicationStatus),
      ]);
      statusRepositoryMock.enable.mockResolvedValueOnce(
        new ServiceStatusApplicationEntity(statusRepositoryMock, { ...bobsApplicationStatus, enabled: true })
      );
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
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        body: {
          name: 'new-application',
          description: 'mock test application',
          endpoint: 'http://mock-test.com',
        },
      } as unknown as Request;
      const expectedApp = {
        appKey: 'app_test-new-application',
        name: 'new-application',
        url: 'localhost',
        description: 'foo',
        tenantId: tenantId,
      };
      const handler = createNewApplication(loggerMock, applicationRepo, tenantServiceMock);
      const randomId = 'app_do-not-mock-me';
      configurationService.getConfiguration
        .mockResolvedValueOnce(configurationMock)
        .mockResolvedValueOnce({ ...configurationMock, [randomId]: expectedApp });
      statusRepositoryMock.find.mockResolvedValueOnce([applicationStatusMock[1]]);
      await handler(req, resMock, nextMock);
      expect(resMock.status).toHaveBeenCalledWith(201);
    });

    it('Cant create duplicate application', async () => {
      const createMock = jest.fn().mockReturnValue(applicationStatusMock[1]);
      ServiceStatusApplicationEntity.create = createMock;
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        body: {
          name: 'test-mock',
          description: 'mock test application',
          endpoint: 'http://mock-test.com',
        },
      } as unknown as Request;
      const handler = createNewApplication(loggerMock, applicationRepo, tenantServiceMock);
      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
      await handler(req, resMock, nextMock);
      expect(resMock.send).not.toHaveBeenCalled();
      expect(nextMock).toBeCalledWith(expect.any(InvalidValueError));
    });
  });

  describe('Can update application', () => {
    it('Can update application properties', async () => {
      const handler = updateApplication(loggerMock, applicationRepo);
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
          appKey: bobsAppKey,
        },
      } as unknown as Request;
      statusRepositoryMock.find.mockResolvedValueOnce([applicationStatusMock[1]]);
      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
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
      jest.spyOn(eventFuncs, 'applicationStatusChange').mockReturnValue({} as unknown as DomainEvent);

      const handler = updateApplicationStatus(loggerMock, applicationRepo, eventServiceMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {
          appKey: bobsAppKey,
        },
        body: {
          status: 'maintenance',
        },
      } as unknown as Request;
      configurationService.getConfiguration.mockResolvedValueOnce(configurationMock);
      statusRepositoryMock.find.mockResolvedValueOnce([applicationStatusMock[1]]);
      await handler(req, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'maintenance',
        })
      );
    });
    it('Can delete application', async () => {
      configurationService.getConfiguration.mockResolvedValue(configurationMock);
      statusRepositoryMock.get.mockResolvedValueOnce(applicationStatusMock[1]);
      const handler = deleteApplication(loggerMock, applicationRepo, eventServiceMock);
      const req: Request = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        params: {
          appKey: bobsAppKey,
        },
      } as unknown as Request;
      statusRepositoryMock.find.mockResolvedValueOnce([applicationStatusMock[1]]);
      await handler(req, resMock, nextMock);
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });
  });
});
