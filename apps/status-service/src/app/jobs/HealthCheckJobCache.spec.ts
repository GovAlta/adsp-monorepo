import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { HealthCheckJobCache } from './HealthCheckJobCache';
import { HealthCheckJob } from './HealthCheckJob';

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
    cache.addBatch(mockApplications, { schedule: jest.fn() });
    expect(cache.getApplicationIds().length).toEqual(3);
    expect(cache.get('application 1').getUrl()).toEqual('http://www.application1.com');
    expect(cache.get('application 2').getUrl()).toEqual('http://www.application2.com');
    expect(cache.get('application 3').getUrl()).toEqual('http://www.application3.com');
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

  it('can update  application jobs', () => {
    cache.clear(jest.fn());
    cache.addBatch(mockApplications, { schedule: jest.fn() });
    cache.remove('application 1', jest.fn());
    const newApp = {
      _id: 'application 1',
      endpoint: { url: 'https://application/1' },
    } as undefined as ServiceStatusApplicationEntity;

    cache.add(newApp, { schedule: jest.fn() });
    expect(cache.getApplicationIds().length).toEqual(3);
    expect(cache.get('application 1').getUrl()).toEqual('https://application/1');
  });
});
