import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { HealthCheckJob, HealthCheckJobCache } from './HealthCheckJobCache';

describe('HealthCheckJobCache', () => {
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

  const cache = new HealthCheckJobCache(loggerMock);
  it('can add multiple application jobs', () => {
    cache.addBatch(mockApplications);
    expect(cache.getApplicationIds().length).toEqual(3);
    expect(cache.get('application 1').url).toEqual('http://www.application1.com');
    expect(cache.get('application 2').url).toEqual('http://www.application2.com');
    expect(cache.get('application 3').url).toEqual('http://www.application3.com');
    expect(cache.get('toot!')).toBeNull;
    expect(cache.exists('application 1')).toBeTruthy;
    expect(cache.exists('application 2')).toBeTruthy;
    expect(cache.exists('application 3')).toBeTruthy;
    expect(cache.exists('application 4')).toBeFalsy;
  });

  it('can clear the cache', () => {
    cache.clear((job: HealthCheckJob) => {
      expect(job).not.toBeNull;
    });
    expect(cache.getApplicationIds().length).toEqual(0);
  });

  it('can update all application jobs', () => {
    cache.addBatch(mockApplications);
    const re = new RegExp('[a-z\\/]+([0-9]).*');
    cache.updateJobs((job: HealthCheckJob) => {
      const match = job.url.match(re);
      job.url = `https://application/${match[1]}`;
    });
    expect(cache.getApplicationIds().length).toEqual(3);
    expect(cache.get('application 1').url).toEqual('https://application/1');
    expect(cache.get('application 2').url).toEqual('https://application/2');
    expect(cache.get('application 3').url).toEqual('https://application/3');

    cache.clear(jest.fn());
  });
});
