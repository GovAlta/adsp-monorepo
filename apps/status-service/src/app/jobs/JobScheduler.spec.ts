import { Logger } from 'winston';
import { HealthCheckJobScheduler, HealthCheckSchedulingProps } from './JobScheduler';
import { ServiceStatusApplicationEntity } from '../model';
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

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
    getResourceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('Toot!')),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
  };

  const statusMock: ServiceStatusApplicationEntity[] = [
    {
      _id: '620ae946ddd181001195caad',
      tenantId: 'urn:ads:mock-tenant:mock-service:bob:bobs-id',
      endpoint: { url: 'https://www.yahoo.com' },
    },
    {
      _id: '620ae946ddd181001195cbbc',
      tenantId: 'urn:ads:mock-tenant:mock-service:bob:bobs-id',
      endpoint: { url: 'https://www.google.com' },
    },
    {
      _id: '620ae946eee181001195ca3d',
      tenantId: 'urn:ads:mock-tenant:mock-service:bob:bobs-id',
      endpoint: { url: 'https://www.boogie.com' },
    },
  ] as unknown as ServiceStatusApplicationEntity[];

  const statusRepoMock: ServiceStatusRepository = {
    findEnabledApplications: jest.fn().mockReturnValueOnce(statusMock),
  } as unknown as ServiceStatusRepository;

  const appManagerFactory = (service: string): ApplicationManager => {
    return new ApplicationManager(
      tokenProviderMock,
      configurationServiceMock,
      adspId`${service}`,
      statusRepoMock,
      directoryMock
    );
  };

  const appMock = [
    {
      [statusMock[0]._id]: {
        name: 'MyApp 1',
        url: 'https://www.yahoo.com',
        description: 'MyApp goes to Hollywood',
      },
    },
    {
      [statusMock[1]._id]: {
        name: 'MyApp 2',
        url: 'https://www.google.com',
        description: 'MyApp - the sequel',
      },
    },
    {
      [statusMock[2]._id]: {
        name: 'MyApp 3',
        url: 'https://www.boogie.com',
        description: 'MyApp - Going back in time',
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
    configurationServiceMock.getConfiguration
      .mockResolvedValueOnce(appMock[0])
      .mockResolvedValueOnce(appMock[1])
      .mockResolvedValueOnce(appMock[2]);

    jobCache.clear(jest.fn());
    await jobScheduler.loadHealthChecks(healthCheckScheduler, dataResetScheduler, cacheReloadScheduler);
    expect(dataResetScheduler).toHaveBeenCalledTimes(1);
    expect(cacheReloadScheduler).toHaveBeenCalledTimes(1);
    expect(healthCheckScheduler.schedule).toHaveBeenCalledTimes(3);
    expect(healthCheckScheduler.schedule).toHaveBeenCalledWith(statusMock[0]._id, 'https://www.yahoo.com');
    expect(healthCheckScheduler.schedule).toHaveBeenCalledWith(statusMock[1]._id, 'https://www.google.com');
    expect(healthCheckScheduler.schedule).toHaveBeenCalledWith(statusMock[2]._id, 'https://www.boogie.com');
    expect(jobCache.getApplicationIds().length).toEqual(3);
    expect(jobCache.exists('application 1')).not.toBeNull;
  });

  it('can start individual health check jobs', () => {
    jobCache.clear(jest.fn());
    const scheduler = jest.fn();
    jobScheduler.startHealthChecks(statusMock[0], getScheduler(props, scheduler));
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(jobCache.getApplicationIds().length).toEqual(1);
    const app = jobCache.get(statusMock[0]._id);
    expect(app).not.toBeNull;
    expect(app.isScheduled).not.toBeNull;
  });

  it('can stop individual health check jobs', () => {
    jobCache.clear(jest.fn());
    jobScheduler.startHealthChecks(statusMock[0], getScheduler(props, jest.fn()));
    const cancelJob = jest.fn();
    jobScheduler.stopHealthChecks(statusMock[0]._id, cancelJob);
    expect(cancelJob).toBeCalledTimes(1);
    const app = jobCache.get(statusMock[0]._id);
    expect(app).toBeNull;
  });
});
