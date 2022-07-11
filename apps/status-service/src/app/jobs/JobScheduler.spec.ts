import { Logger } from 'winston';
import { HealthCheckJobScheduler } from './JobScheduler';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EventService } from '@abgov/adsp-service-sdk';
import { HealthCheckJob, HealthCheckJobCache } from './HealthCheckJobCache';

describe('JobScheduler', () => {
  const loggerMock: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const mockApplications: ServiceStatusApplicationEntity[] = [
    {
      _id: 'application 1',
      endpoint: { url: 'http://www.application1.com' },
    },
    {
      _id: 'application 2',
      endpoint: { url: 'http://www.application2.com' },
    },
    {
      _id: 'application 3',
      endpoint: { url: 'http://www.application3.com' },
    },
  ] as unknown as ServiceStatusApplicationEntity[];

  const endpointRepoMock: EndpointStatusEntryRepository = {
    deleteOldUrlStatus: jest.fn(),
  } as unknown as EndpointStatusEntryRepository;

  const eventServiceMock: EventService = {
    foo: 'foo',
  } as unknown as EventService;

  const statusRepoMock: ServiceStatusRepository = {
    findEnabledApplications: jest.fn().mockReturnValueOnce(mockApplications),
  } as unknown as ServiceStatusRepository;

  const jobScheduler = new HealthCheckJobScheduler({
    logger: loggerMock,
    serviceStatusRepository: statusRepoMock,
    endpointStatusEntryRepository: endpointRepoMock,
    eventService: eventServiceMock,
  });

  const jobCache = new HealthCheckJobCache(loggerMock);

  it('can load and start persistent health check jobs', async () => {
    const healthCheckScheduler = jest.fn();
    const dataResetScheduler = jest.fn();
    const cacheReloadScheduler = jest.fn();

    jobCache.clear(jest.fn());
    await jobScheduler.loadHealthChecks(healthCheckScheduler, dataResetScheduler, cacheReloadScheduler);
    expect(dataResetScheduler).toHaveBeenCalledTimes(1);
    expect(cacheReloadScheduler).toHaveBeenCalledTimes(1);
    expect(healthCheckScheduler).toHaveBeenCalledTimes(3);
    expect(healthCheckScheduler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://www.application1.com',
        applicationId: 'application 1',
        job: null,
      })
    );
    expect(healthCheckScheduler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://www.application2.com',
        applicationId: 'application 2',
        job: null,
      })
    );
    expect(healthCheckScheduler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://www.application3.com',
        applicationId: 'application 3',
        job: null,
      })
    );
    expect(jobCache.getApplicationIds().length).toEqual(3);
    expect(jobCache.exists('application 1')).not.toBeNull;
  });

  it('can start individual health check jobs', () => {
    jobCache.clear(jest.fn());
    const scheduler = jest.fn() as unknown as (job: HealthCheckJob) => void;
    jobScheduler.startHealthChecks(mockApplications[0], scheduler);
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(jobCache.getApplicationIds().length).toEqual(1);
    const app = jobCache.get(mockApplications[0]._id);
    expect(app).not.toBeNull;
    expect(app.isScheduled).not.toBeNull;
  });

  it('can stop individual health check jobs', () => {
    jobCache.clear(jest.fn());
    const scheduler = jest.fn() as unknown as (job: HealthCheckJob) => void;
    jobScheduler.startHealthChecks(mockApplications[0], scheduler);
    const cancelJob = jest.fn();
    jobScheduler.stopHealthChecks(mockApplications[0]._id, cancelJob);
    expect(cancelJob).toBeCalledTimes(1);
    const app = jobCache.get(mockApplications[0]._id);
    expect(app).toBeNull;
  });
});
