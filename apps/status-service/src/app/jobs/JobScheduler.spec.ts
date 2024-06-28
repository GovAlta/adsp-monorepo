import { Logger } from 'winston';
import { HealthCheckJobScheduler, HealthCheckSchedulingProps } from './JobScheduler';
import { ApplicationConfiguration, ServiceStatusApplicationEntity, StatusServiceConfiguration } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { adspId, EventService } from '@abgov/adsp-service-sdk';
import { HealthCheckJobCache } from './HealthCheckJobCache';
import { getScheduler } from './SchedulerFactory';
import { ApplicationManager } from '../model/applicationManager';

describe('JobScheduler', () => {
  const loggerMock: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('Toot!')),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenant: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const directoryServiceMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const tenantId = adspId`urn:ads:mock-tenant:mock-service:bob:bobs-id`;

  const appKey0 = 'app_mock-key-0';
  const appKey1 = 'app_mock-key-1';
  const appKey2 = 'app_mock-key-2';
  const appMock = [
    {
      [appKey0]: {
        appKey: appKey0,
        name: 'MyApp 1',
        url: 'https://www.yahoo.com',
        description: 'MyApp goes to Hollywood',
      },
    },
    {
      [appKey1]: {
        appKey: appKey1,
        name: 'MyApp 2',
        url: 'https://www.google.com',
        description: 'MyApp - the sequel',
      },
    },
    {
      [appKey2]: {
        appKey: appKey2,
        name: 'MyApp 3',
        url: 'https://www.boogie.com',
        description: 'MyApp - Going back in time',
      },
    },
  ];

  const statusMock: ServiceStatusApplicationEntity[] = [
    {
      _id: '620ae946ddd181001195caad',
      appKey: appKey0,
      endpoint: { url: 'https://www.yahoo.com' },
      enabled: true,
      tenantId: tenantId,
    },
    {
      _id: '620ae946d/9/908=dd181001195cbbc',
      appKey: appKey1,
      endpoint: { url: 'https://www.google.com' },
      enabled: true,
      tenantId: tenantId,
    },
    {
      _id: '620ae946eee181001195ca3d',
      appKey: appKey2,
      endpoint: { url: 'https://www.boogie.com' },
      enabled: false,
      tenantId: tenantId,
    },
  ] as unknown as ServiceStatusApplicationEntity[];

  const statusRepoMock: ServiceStatusRepository = {
    findEnabledApplications: jest.fn().mockReturnValue(statusMock),
  } as unknown as ServiceStatusRepository;

  const appManagerFactory = (service: string): ApplicationManager => {
    return new ApplicationManager(
      tokenProviderMock,
      configurationServiceMock,
      adspId`${service}`,
      statusRepoMock,
      endpointRepoMock,
      directoryServiceMock,
      tenantServiceMock,
      loggerMock
    );
  };

  const endpointRepoMock: EndpointStatusEntryRepository = {
    deleteOldUrlStatus: jest.fn(),
    deleteAll: jest.fn(),
  } as unknown as EndpointStatusEntryRepository;

  const eventServiceMock: EventService = {
    foo: 'foo',
  } as unknown as EventService;

  const mockTokenProvider = {
    getAccessToken: jest.fn(),
  };

  const serviceDirectoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
    getResourceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
  };

  const props: HealthCheckSchedulingProps = {
    logger: loggerMock,
    serviceStatusRepository: statusRepoMock,
    endpointStatusEntryRepository: endpointRepoMock,
    eventService: eventServiceMock,
    applicationManager: appManagerFactory('urn:ads:mock-tenant:mock-service'),
    tokenProvider: mockTokenProvider,
    directory: serviceDirectoryMock,
    configurationService: configurationServiceMock,
    serviceId: adspId`urn:ads:platform:test-service`,
  };
  const jobScheduler = new HealthCheckJobScheduler(props);

  const jobCache = new HealthCheckJobCache(loggerMock);

  it('can load and start persistent health check jobs', async () => {
    const healthCheckScheduler = { schedule: jest.fn() };
    const dataResetScheduler = jest.fn();
    const cacheReloadScheduler = jest.fn();

    const app0: ApplicationConfiguration = appMock[0][appKey0];
    const app1: ApplicationConfiguration = appMock[1][appKey1];
    const app2: ApplicationConfiguration = appMock[2][appKey2];
    const appConfig: StatusServiceConfiguration = {
      ...appMock[0],
      ...appMock[1],
      ...appMock[2],
    };

    configurationServiceMock.getConfiguration.mockResolvedValueOnce(appConfig);
    tenantServiceMock.getTenants.mockResolvedValueOnce([{ id: tenantId }]);

    jobCache.clear(jest.fn());
    await jobScheduler.loadHealthChecks(healthCheckScheduler, dataResetScheduler, cacheReloadScheduler);
    expect(dataResetScheduler).toHaveBeenCalledTimes(1);
    expect(cacheReloadScheduler).toHaveBeenCalledTimes(1);
    expect(healthCheckScheduler.schedule).toHaveBeenCalledTimes(2);
    expect(healthCheckScheduler.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ ...app0, tenantId: tenantId })
    );
    expect(healthCheckScheduler.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ ...app1, tenantId: tenantId })
    );
    expect(jobCache.getApplicationIds().length).toEqual(2);
    expect(jobCache.exists(app0.appKey)).toBe(true);
    expect(jobCache.exists(app1.appKey)).toBe(true);
    expect(jobCache.exists(app2.appKey)).toBe(false);
  });

  it('can start individual health check jobs', () => {
    jobCache.clear(jest.fn());
    const scheduler = jest.fn();
    const app0 = appMock[0][appKey0] as ApplicationConfiguration;
    jobScheduler.startHealthChecks({ ...app0, tenantId }, getScheduler(props, scheduler));
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(jobCache.getApplicationIds().length).toEqual(1);
    const app = jobCache.get(appKey0);
    expect(app).not.toBeNull;
    expect(app.isScheduled).not.toBeNull;
  });

  it('can stop individual health check jobs', () => {
    jobCache.clear(jest.fn());
    const app0 = appMock[0][appKey0];
    jobScheduler.startHealthChecks({ ...app0, tenantId }, getScheduler(props, jest.fn()));
    const cancelJob = jest.fn();
    jobScheduler.stopHealthChecks(appKey0, cancelJob);
    expect(cancelJob).toBeCalledTimes(1);
    const app = jobCache.get(appKey0);
    expect(app).toBeNull;
  });
});
