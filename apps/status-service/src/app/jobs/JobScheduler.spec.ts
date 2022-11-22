import { Logger } from 'winston';
import { HealthCheckJobScheduler, HealthCheckSchedulingProps } from './JobScheduler';
import { ServiceStatusApplicationEntity, StaticApplicationData } from '../model';
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

  const notificationServiceMock = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    get: jest.fn(),
  };

  const statusMock: ServiceStatusApplicationEntity[] = [
    {
      _id: '620ae946ddd181001195caad',
      appKey: 'apps-mock-key-0',
      endpoint: { url: 'https://www.yahoo.com' },
      enabled: true,
    },
    {
      _id: '620ae946ddd181001195cbbc',
      appKey: 'apps-mock-key-1',
      endpoint: { url: 'https://www.google.com' },
      enabled: true,
    },
    {
      _id: '620ae946eee181001195ca3d',
      appKey: 'apps-mock-key-2',
      endpoint: { url: 'https://www.boogie.com' },
      enabled: false,
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
      directoryServiceMock,
      tenantServiceMock,
      notificationServiceMock,
      loggerMock
    );
  };

  const tenantId = adspId`urn:ads:mock-tenant:mock-service:bob:bobs-id`;

  const appMock = [
    {
      [statusMock[0]._id]: {
        _id: statusMock[0]._id,
        appKey: statusMock[0].appKey,
        name: 'MyApp 1',
        url: 'https://www.yahoo.com',
        description: 'MyApp goes to Hollywood',
        tenantId: tenantId,
      },
    },
    {
      [statusMock[1]._id]: {
        _id: statusMock[1]._id,
        appKey: statusMock[1].appKey,
        name: 'MyApp 2',
        url: 'https://www.google.com',
        description: 'MyApp - the sequel',
        tenantId: tenantId,
      },
    },
    {
      [statusMock[2]._id]: {
        _id: statusMock[2]._id,
        appKey: statusMock[2].appKey,
        name: 'MyApp 3',
        url: 'https://www.boogie.com',
        description: 'MyApp - Going back in time',
        tenantId: tenantId,
      },
    },
  ];
  const endpointRepoMock: EndpointStatusEntryRepository = {
    deleteOldUrlStatus: jest.fn(),
  } as unknown as EndpointStatusEntryRepository;

  const eventServiceMock: EventService = {
    foo: 'foo',
  } as unknown as EventService;

  const props: HealthCheckSchedulingProps = {
    logger: loggerMock,
    serviceStatusRepository: statusRepoMock,
    endpointStatusEntryRepository: endpointRepoMock,
    eventService: eventServiceMock,
    applicationManager: appManagerFactory('urn:ads:mock-tenant:mock-service'),
  };
  const jobScheduler = new HealthCheckJobScheduler(props);

  const jobCache = new HealthCheckJobCache(loggerMock);

  it('can load and start persistent health check jobs', async () => {
    const healthCheckScheduler = { schedule: jest.fn() };
    const dataResetScheduler = jest.fn();
    const cacheReloadScheduler = jest.fn();

    const app0 = appMock[0][statusMock[0]._id];
    const app1 = appMock[1][statusMock[1]._id];
    const app2 = appMock[2][statusMock[2]._id];
    const appConfig = {
      ...appMock[0],
      ...appMock[1],
      ...appMock[2],
    };

    configurationServiceMock.getConfiguration.mockResolvedValueOnce(appConfig);
    tenantServiceMock.getTenants.mockResolvedValueOnce([{ id: app0.tenantId }]);

    jobCache.clear(jest.fn());
    await jobScheduler.loadHealthChecks(healthCheckScheduler, dataResetScheduler, cacheReloadScheduler);
    expect(dataResetScheduler).toHaveBeenCalledTimes(1);
    expect(cacheReloadScheduler).toHaveBeenCalledTimes(1);
    expect(healthCheckScheduler.schedule).toHaveBeenCalledTimes(2);
    expect(healthCheckScheduler.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ ...app0, tenantId: app0.tenantId })
    );
    expect(healthCheckScheduler.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ ...app1, tenantId: app1.tenantId })
    );
    expect(jobCache.getApplicationIds().length).toEqual(2);
    expect(jobCache.exists(app0.appKey)).toBe(true);
    expect(jobCache.exists(app1.appKey)).toBe(true);
    expect(jobCache.exists(app2.appKey)).toBe(false);
  });

  it('can start individual health check jobs', () => {
    jobCache.clear(jest.fn());
    const scheduler = jest.fn();
    const app0 = appMock[0][statusMock[0]._id] as StaticApplicationData;
    jobScheduler.startHealthChecks(app0, getScheduler(props, scheduler));
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(jobCache.getApplicationIds().length).toEqual(1);
    const app = jobCache.get(statusMock[0].appKey);
    expect(app).not.toBeNull;
    expect(app.isScheduled).not.toBeNull;
  });

  it('can stop individual health check jobs', () => {
    jobCache.clear(jest.fn());
    const app0 = appMock[0][statusMock[0]._id];
    jobScheduler.startHealthChecks(app0, getScheduler(props, jest.fn()));
    const cancelJob = jest.fn();
    jobScheduler.stopHealthChecks(statusMock[0].appKey, cancelJob);
    expect(cancelJob).toBeCalledTimes(1);
    const app = jobCache.get(statusMock[0].appKey);
    expect(app).toBeNull;
  });
});
